/**
 * Single section item component
 * Displays and manages a single section configuration
 */

import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, useRoutesStore } from '@/store';
import type { Section } from '@/store';
import {
  SectionHeader,
  SourceSelector,
  LaneSelector,
  HoldRangeSelector,
  ColorPicker,
  AnchorConfigurator,
  ExcludeHoldsSelector,
  type AnchorPosition,
} from '../section';
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
  const { updateSection, removeSection } = useConfigStore(
    useShallow((s) => ({
      updateSection: s.updateSection,
      removeSection: s.removeSection,
    }))
  );
  const { getRouteNames, getHoldLabels, getFirstHoldLabel, getLastHoldLabel, getFirstHoldPosition, getRouteColor } = useRoutesStore(
    useShallow((s) => ({
      getRouteNames: s.getRouteNames,
      getHoldLabels: s.getHoldLabels,
      getFirstHoldLabel: s.getFirstHoldLabel,
      getLastHoldLabel: s.getLastHoldLabel,
      getFirstHoldPosition: s.getFirstHoldPosition,
      getRouteColor: s.getRouteColor,
    }))
  );
  const routeNames = getRouteNames();
  const holdLabels = getHoldLabels(section.source);
  const defaultAnchor = getFirstHoldPosition(section.source) ?? DEFAULT_ANCHOR;

  // Local color state for immediate visual feedback during color picker drag
  const [localColor, setLocalColor] = useState(section.color);
  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local color with section color when section changes externally
  useEffect(() => {
    setLocalColor(section.color);
  }, [section.color]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (colorDebounceRef.current) {
        clearTimeout(colorDebounceRef.current);
      }
    };
  }, []);

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

    // Also update local color immediately
    if (routeColor) {
      setLocalColor(routeColor);
    }

    updateSection(section.id, {
      source: newSource,
      fromHold: firstLabel ?? 1,
      toHold: lastLabel ?? 1,
      anchor,
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
  const handleColorChange = useCallback((color: string) => {
    // Update local state immediately for visual feedback
    setLocalColor(color);

    // Clear pending store update
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }

    // Debounce store update to avoid excessive SVG regeneration
    colorDebounceRef.current = setTimeout(() => {
      updateSection(section.id, { color });
    }, 150);
  }, [section.id, updateSection]);

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
        displayColor={localColor}
      />

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2">
          <SourceSelector
            value={section.source}
            routeNames={routeNames}
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

          <ColorPicker
            value={localColor}
            onChange={handleColorChange}
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
