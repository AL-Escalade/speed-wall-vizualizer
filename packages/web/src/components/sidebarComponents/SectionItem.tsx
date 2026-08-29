/**
 * Single section item component
 * Displays and manages a single section configuration
 */

import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, useRoutesStore, type Section } from '@/store';
import {
  SectionHeader,
  SourceSelector,
  LaneSelector,
  HoldRangeSelector,
  SectionColorPickers,
  AnchorConfigurator,
  ExcludeHoldsSelector,
  type AnchorPosition,
} from '../section';
import { isSectionColorCustomized } from '@/utils/sectionColors';
import {
  COMPETITION_ANCHOR,
  DEFAULT_ANCHOR,
  isCompetitionRoute,
  type CoordinateSystemId,
} from '@/constants/routes';

export interface SectionItemProps {
  section: Section;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  lanesCount: number;
  coordinateDisplaySystem: CoordinateSystemId;
}

export const SectionItem = memo(function SectionItem({
  section,
  isExpanded,
  onToggle,
  lanesCount,
  coordinateDisplaySystem,
}: SectionItemProps) {
  const { updateSection, removeSection, setSectionColors, resetSectionColors } = useConfigStore(
    useShallow((s) => ({
      updateSection: s.updateSection,
      removeSection: s.removeSection,
      setSectionColors: s.setSectionColors,
      resetSectionColors: s.resetSectionColors,
    }))
  );
  const { getRouteNames, getHoldLabels, getFirstHoldLabel, getLastHoldLabel, getFirstHoldPosition, getRouteColor, getRouteColorMap, getRouteReferenceUrl } = useRoutesStore(
    useShallow((s) => ({
      getRouteNames: s.getRouteNames,
      getHoldLabels: s.getHoldLabels,
      getFirstHoldLabel: s.getFirstHoldLabel,
      getLastHoldLabel: s.getLastHoldLabel,
      getFirstHoldPosition: s.getFirstHoldPosition,
      getRouteColor: s.getRouteColor,
      getRouteColorMap: s.getRouteColorMap,
      getRouteReferenceUrl: s.getRouteReferenceUrl,
    }))
  );
  const routeNames = getRouteNames();
  const holdLabels = getHoldLabels(section.source);
  const defaultAnchor = getFirstHoldPosition(section.source) ?? DEFAULT_ANCHOR;

  // Local color overlay for immediate visual feedback during color picker drag.
  // A single map with a single timer, rather than one hook per tag: the tag
  // count changes when the source route changes, which would break hook order.
  //
  // The overlay is cleared as soon as it is flushed to the store, so it only
  // ever holds in-flight values. A persistent overlay would shadow the store
  // whenever the section changed underneath - an import reusing this section's
  // id keeps the component mounted, so its state would survive the swap.
  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const pendingColorsRef = useRef<Record<string, string>>({});
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
  }, []);

  const routeColorMap = getRouteColorMap(section.source) ?? {};
  const colorTags = Object.keys(routeColorMap);
  const effectiveColors = Object.fromEntries(
    colorTags.map((tag) => [tag, localColors[tag] ?? section.colors?.[tag] ?? routeColorMap[tag]])
  );

  // Handlers
  const handleToggleClick = useCallback(() => {
    onToggle(section.id);
  }, [onToggle, section.id]);

  const handleRename = useCallback((name: string) => {
    updateSection(section.id, { name });
  }, [section.id, updateSection]);

  const handleRemove = useCallback(() => {
    removeSection(section.id);
  }, [section.id, removeSection]);

  const handleSourceChange = useCallback((newSource: string) => {
    const firstLabel = getFirstHoldLabel(newSource);
    const lastLabel = getLastHoldLabel(newSource);
    const routeColor = getRouteColor(newSource);
    const anchor = isCompetitionRoute(newSource)
      ? COMPETITION_ANCHOR
      : getFirstHoldPosition(newSource) ?? DEFAULT_ANCHOR;

    // Color tags are route-specific, so overrides cannot survive a source change
    setLocalColors({});
    pendingColorsRef.current = {};

    updateSection(section.id, {
      source: newSource,
      fromHold: firstLabel ?? 1,
      toHold: lastLabel ?? 1,
      anchor,
      colors: {},
      color: routeColor ?? section.color,
      excludeHolds: [],
    });
  }, [section.id, section.color, getFirstHoldLabel, getLastHoldLabel, getRouteColor, getFirstHoldPosition, updateSection]);

  const handleLaneChange = useCallback((newLane: number) => {
    const clamped = Math.max(0, Math.min(newLane, lanesCount - 1));
    updateSection(section.id, { lane: clamped });
  }, [section.id, lanesCount, updateSection]);

  const handleFromChange = useCallback((value: string) => {
    // Clean excludeHolds that fall outside the new range
    const fromIdx = holdLabels.indexOf(value);
    const toIdx = holdLabels.indexOf(String(section.toHold));
    if (fromIdx !== -1 && toIdx !== -1) {
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const validLabels = new Set(holdLabels.slice(start, end + 1));
      const cleaned = (section.excludeHolds ?? []).filter((h) => validLabels.has(h));
      updateSection(section.id, { fromHold: value, excludeHolds: cleaned });
    } else {
      updateSection(section.id, { fromHold: value, excludeHolds: [] });
    }
  }, [section.id, section.toHold, section.excludeHolds, holdLabels, updateSection]);

  const handleToChange = useCallback((value: string) => {
    const fromIdx = holdLabels.indexOf(String(section.fromHold));
    const toIdx = holdLabels.indexOf(value);
    if (fromIdx !== -1 && toIdx !== -1) {
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const validLabels = new Set(holdLabels.slice(start, end + 1));
      const cleaned = (section.excludeHolds ?? []).filter((h) => validLabels.has(h));
      updateSection(section.id, { toHold: value, excludeHolds: cleaned });
    } else {
      updateSection(section.id, { toHold: value, excludeHolds: [] });
    }
  }, [section.id, section.fromHold, section.excludeHolds, holdLabels, updateSection]);

  // Debounced color change: update local state immediately, store after delay
  const handleColorChange = useCallback((tag: string, color: string) => {
    // Update local state immediately for visual feedback
    setLocalColors((prev) => ({ ...prev, [tag]: color }));

    // Accumulate into a map, not a scalar: dragging one picker then another
    // within the debounce window must not drop the first value
    pendingColorsRef.current[tag] = color;

    // Clear pending store update
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }

    // Debounce store update to avoid excessive SVG regeneration
    colorDebounceRef.current = setTimeout(() => {
      setSectionColors(section.id, pendingColorsRef.current);
      pendingColorsRef.current = {};
      // Hand rendering back to the store in the same tick, so the overlay never
      // outlives the write it was covering for
      setLocalColors({});
    }, 150);
  }, [section.id, setSectionColors]);

  const handleColorReset = useCallback(() => {
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }
    pendingColorsRef.current = {};
    setLocalColors({});
    resetSectionColors(section.id);
  }, [section.id, resetSectionColors]);

  // Holds in the [fromHold, toHold] range for the exclude selector
  const rangeHoldLabels = useMemo(() => {
    const fromStr = String(section.fromHold);
    const toStr = String(section.toHold);
    const fromIdx = holdLabels.indexOf(fromStr);
    const toIdx = holdLabels.indexOf(toStr);
    if (fromIdx === -1 || toIdx === -1) return holdLabels;
    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    return holdLabels.slice(start, end + 1);
  }, [holdLabels, section.fromHold, section.toHold]);

  const handleExcludeChange = useCallback((excludeHolds: string[]) => {
    updateSection(section.id, { excludeHolds });
  }, [section.id, updateSection]);

  const handleAnchorUpdate = useCallback((anchor: AnchorPosition) => {
    updateSection(section.id, { anchor });
  }, [section.id, updateSection]);

  const handleAnchorReset = useCallback(() => {
    const firstPos = getFirstHoldPosition(section.source);
    if (firstPos) {
      updateSection(section.id, { anchor: firstPos });
    }
  }, [section.id, section.source, getFirstHoldPosition, updateSection]);

  return (
    <div className="card bg-base-200">
      <SectionHeader
        section={section}
        isExpanded={isExpanded}
        onToggle={handleToggleClick}
        onRename={handleRename}
        onRemove={handleRemove}
        displayColors={colorTags.map((tag) => effectiveColors[tag])}
      />

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2">
          <SourceSelector
            value={section.source}
            routeNames={routeNames}
            referenceUrl={getRouteReferenceUrl(section.source)}
            onChange={handleSourceChange}
          />

          <LaneSelector
            value={section.lane}
            lanesCount={lanesCount}
            onChange={handleLaneChange}
          />

          <HoldRangeSelector
            fromHold={section.fromHold}
            toHold={section.toHold}
            holdLabels={holdLabels}
            onFromChange={handleFromChange}
            onToChange={handleToChange}
          />

          <SectionColorPickers
            tags={colorTags}
            values={effectiveColors}
            isCustomized={isSectionColorCustomized(section)}
            onChange={handleColorChange}
            onReset={handleColorReset}
          />

          <AnchorConfigurator
            anchor={section.anchor}
            defaultAnchor={defaultAnchor}
            onUpdate={handleAnchorUpdate}
            onReset={handleAnchorReset}
            coordinateDisplaySystem={coordinateDisplaySystem}
            lane={section.lane}
            lanesCount={lanesCount}
            onLaneChange={handleLaneChange}
          />

          <ExcludeHoldsSelector
            holdLabels={rangeHoldLabels}
            excludeHolds={section.excludeHolds ?? []}
            onChange={handleExcludeChange}
          />
        </div>
      )}
    </div>
  );
});
