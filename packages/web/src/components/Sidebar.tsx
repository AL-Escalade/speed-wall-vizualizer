/**
 * Sidebar component with wall configuration and section management
 */

import { useState, memo, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useIntl } from 'react-intl';
import { useConfigStore, useRoutesStore, useViewerStore, DEFAULT_DISPLAY_OPTIONS } from '@/store';
import type { Section, LanguageSetting } from '@/store';
import {
  SectionHeader,
  SourceSelector,
  LaneSelector,
  HoldRangeSelector,
  ColorPicker,
  AnchorConfigurator,
  type AnchorPosition,
} from './section';
import {
  ROUTE_SOURCES,
  COMPETITION_ANCHOR,
  DEFAULT_ANCHOR,
  DEFAULT_HOLDS,
  DEFAULT_SECTION_COLOR,
  isCompetitionRoute,
  COORDINATE_SYSTEM_NAMES,
  COORDINATE_SYSTEM_INTL_KEYS,
  DEFAULT_COORDINATE_SYSTEM,
  type CoordinateSystemId,
} from '@/constants/routes';

/** Configuration selector component */
function ConfigSelector() {
  const intl = useIntl();
  const { configurations, activeConfigId, setActiveConfiguration, createConfiguration, deleteConfiguration, renameConfiguration } =
    useConfigStore(
      useShallow((s) => ({
        configurations: s.configurations,
        activeConfigId: s.activeConfigId,
        setActiveConfiguration: s.setActiveConfiguration,
        createConfiguration: s.createConfiguration,
        deleteConfiguration: s.deleteConfiguration,
        renameConfiguration: s.renameConfiguration,
      }))
    );
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const activeConfig = configurations.find((c) => c.id === activeConfigId);

  const handleNew = () => {
    const name = intl.formatMessage({ id: 'sidebar.configName' }, { number: configurations.length + 1 });
    createConfiguration(name);
  };

  const handleDelete = () => {
    if (activeConfigId && confirm(intl.formatMessage({ id: 'sidebar.deleteConfigConfirm' }))) {
      deleteConfiguration(activeConfigId);
    }
  };

  const handleStartEdit = () => {
    if (activeConfig) {
      setEditName(activeConfig.name);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeConfigId && editName.trim()) {
      renameConfiguration(activeConfigId, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="p-4 border-b border-base-300">
      <label className="label">
        <span className="label-text font-semibold">{intl.formatMessage({ id: 'sidebar.configuration' })}</span>
      </label>
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="input input-bordered input-sm flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <button className="btn btn-sm btn-square btn-ghost text-success" title={intl.formatMessage({ id: 'sidebar.validate' })} onClick={handleSaveEdit}>
            <Check size={16} />
          </button>
          <button className="btn btn-sm btn-square btn-ghost text-error" title={intl.formatMessage({ id: 'sidebar.cancel' })} onClick={handleCancelEdit}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm flex-1"
            value={activeConfigId ?? ''}
            onChange={(e) => setActiveConfiguration(e.target.value || null)}
          >
            {configurations.length === 0 && <option value="">{intl.formatMessage({ id: 'sidebar.noConfiguration' })}</option>}
            {configurations.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-square btn-ghost" title={intl.formatMessage({ id: 'sidebar.rename' })} onClick={handleStartEdit} disabled={!activeConfigId}>
            <Pencil size={16} />
          </button>
          <button className="btn btn-sm btn-square btn-ghost" title={intl.formatMessage({ id: 'sidebar.new' })} onClick={handleNew}>
            <Plus size={16} />
          </button>
          <button
            className="btn btn-sm btn-square btn-ghost"
            title={intl.formatMessage({ id: 'sidebar.delete' })}
            onClick={handleDelete}
            disabled={!activeConfigId}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Wall configuration component */
function WallConfig() {
  const intl = useIntl();
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const updateWall = useConfigStore((s) => s.updateWall);

  if (!config) return null;

  return (
    <div className="p-4 border-b border-base-300">
      <h3 className="font-semibold mb-3">{intl.formatMessage({ id: 'sidebar.wallDimensions' })}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.wallWidth' })}</span>
          </label>
          <input
            type="number"
            min="1"
            max="4"
            value={config.wall.lanes}
            onChange={(e) => updateWall({ lanes: parseInt(e.target.value) || 1 })}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.wallHeight' })}</span>
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={config.wall.panelsHeight}
            onChange={(e) => updateWall({ panelsHeight: parseInt(e.target.value) || 1 })}
            className="input input-bordered input-sm w-full"
          />
        </div>
      </div>
    </div>
  );
}

/** Single section item component - refactored to use sub-components */
const SectionItem = memo(function SectionItem({
  section,
  isExpanded,
  onToggle,
  lanesCount,
  coordinateDisplaySystem,
}: {
  section: Section;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  lanesCount: number;
  coordinateDisplaySystem: CoordinateSystemId;
}) {
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
    });
  }, [section.id, section.color, getFirstHoldLabel, getLastHoldLabel, getRouteColor, getFirstHoldPosition, updateSection]);

  const handleLaneChange = useCallback((lane: number) => {
    updateSection(section.id, { lane });
  }, [section.id, updateSection]);

  const handleFromChange = useCallback((value: string) => {
    updateSection(section.id, { fromHold: value });
  }, [section.id, updateSection]);

  const handleToChange = useCallback((value: string) => {
    updateSection(section.id, { toHold: value });
  }, [section.id, updateSection]);

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
        </div>
      )}
    </div>
  );
});

/** Section list component */
function SectionList() {
  const intl = useIntl();
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const addSection = useConfigStore((s) => s.addSection);
  const { getRouteNames, getFirstHoldLabel, getLastHoldLabel, getFirstHoldPosition, getRouteColor } = useRoutesStore(
    useShallow((s) => ({
      getRouteNames: s.getRouteNames,
      getFirstHoldLabel: s.getFirstHoldLabel,
      getLastHoldLabel: s.getLastHoldLabel,
      getFirstHoldPosition: s.getFirstHoldPosition,
      getRouteColor: s.getRouteColor,
    }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!config) return null;

  const handleAddSection = () => {
    const routeNames = getRouteNames();
    const defaultSource = routeNames[0] ?? ROUTE_SOURCES.IFSC;
    const firstLabel = getFirstHoldLabel(defaultSource);
    const lastLabel = getLastHoldLabel(defaultSource);
    const firstPos = getFirstHoldPosition(defaultSource);
    const routeColor = getRouteColor(defaultSource);
    const sectionNumber = config.sections.length + 1;

    const newId = addSection({
      name: intl.formatMessage({ id: 'sidebar.sectionName' }, { number: sectionNumber }),
      source: defaultSource,
      lane: 0,
      fromHold: firstLabel ?? DEFAULT_HOLDS.FIRST,
      toHold: lastLabel ?? DEFAULT_HOLDS.LAST,
      color: routeColor ?? DEFAULT_SECTION_COLOR,
      anchor: firstPos ?? DEFAULT_ANCHOR,
    });

    // Expand the new section (collapse others)
    setExpandedId(newId);
  };

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="p-4 md:flex-1 md:flex md:flex-col md:min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{intl.formatMessage({ id: 'sidebar.sections' })}</h3>
        <button className="btn btn-sm btn-primary" onClick={handleAddSection}>
          {intl.formatMessage({ id: 'sidebar.addSection' })}
        </button>
      </div>

      <div className="space-y-3 md:flex-1 md:overflow-y-auto">
        {config.sections.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">
            {intl.formatMessage({ id: 'sidebar.noSection' })}
          </div>
        ) : (
          config.sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              isExpanded={expandedId === section.id}
              onToggle={handleToggle}
              lanesCount={config.wall.lanes}
              coordinateDisplaySystem={config.coordinateDisplaySystem ?? DEFAULT_COORDINATE_SYSTEM}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** Display options component */
function DisplayOptions() {
  const intl = useIntl();
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const { updateDisplayOptions, setShowArrow, setCoordinateDisplaySystem, setLanguage } = useConfigStore(
    useShallow((s) => ({
      updateDisplayOptions: s.updateDisplayOptions,
      setShowArrow: s.setShowArrow,
      setCoordinateDisplaySystem: s.setCoordinateDisplaySystem,
      setLanguage: s.setLanguage,
    }))
  );
  const { showSmearingZones, setShowSmearingZones } = useViewerStore(
    useShallow((s) => ({
      showSmearingZones: s.showSmearingZones,
      setShowSmearingZones: s.setShowSmearingZones,
    }))
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Local state for grid color with debounce
  const displayOptions = config?.displayOptions ?? {};
  const [localGridColor, setLocalGridColor] = useState(displayOptions.gridColor ?? DEFAULT_DISPLAY_OPTIONS.gridColor);
  const gridColorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local grid color when config changes externally
  useEffect(() => {
    setLocalGridColor(displayOptions.gridColor ?? DEFAULT_DISPLAY_OPTIONS.gridColor);
  }, [displayOptions.gridColor]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (gridColorDebounceRef.current) {
        clearTimeout(gridColorDebounceRef.current);
      }
    };
  }, []);

  const handleGridColorChange = useCallback((color: string) => {
    setLocalGridColor(color);
    if (gridColorDebounceRef.current) {
      clearTimeout(gridColorDebounceRef.current);
    }
    gridColorDebounceRef.current = setTimeout(() => {
      updateDisplayOptions({ gridColor: color });
    }, 150);
  }, [updateDisplayOptions]);

  if (!config) return null;

  return (
    <div className="border-b border-base-300 md:border-t md:border-b-0 md:bg-base-100">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between hover:bg-base-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold">{intl.formatMessage({ id: 'sidebar.displayOptions' })}</h3>
        <ChevronDown
          size={16}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.coordinateSystem' })}</span>
            </label>
            <select
              className="select select-bordered select-sm w-full"
              value={config.coordinateDisplaySystem ?? DEFAULT_COORDINATE_SYSTEM}
              onChange={(e) => setCoordinateDisplaySystem(e.target.value as CoordinateSystemId)}
            >
              {Object.entries(COORDINATE_SYSTEM_INTL_KEYS).map(([id, intlKey]) => (
                <option key={id} value={id}>
                  {intl.formatMessage({ id: intlKey })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3 py-1">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={config.showArrow ?? false}
                onChange={(e) => setShowArrow(e.target.checked)}
              />
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.showArrows' })}</span>
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3 py-1">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={showSmearingZones}
                onChange={(e) => setShowSmearingZones(e.target.checked)}
              />
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.smearingZones' })}</span>
            </label>
          </div>
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.gridColor' })}</span>
            </label>
            <input
              type="color"
              className="w-full h-10 rounded-lg cursor-pointer border border-base-300"
              value={localGridColor}
              onChange={(e) => handleGridColorChange(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.coordinateSize' })}</span>
            </label>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              className="range range-sm"
              value={displayOptions.labelFontSize ?? DEFAULT_DISPLAY_OPTIONS.labelFontSize}
              onChange={(e) => updateDisplayOptions({ labelFontSize: parseInt(e.target.value) })}
            />
            <div className="text-xs text-base-content/50 text-right mt-1">
              {displayOptions.labelFontSize ?? DEFAULT_DISPLAY_OPTIONS.labelFontSize}px
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.holdLabelSize' })}</span>
            </label>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              className="range range-sm"
              value={displayOptions.holdLabelFontSize ?? DEFAULT_DISPLAY_OPTIONS.holdLabelFontSize}
              onChange={(e) => updateDisplayOptions({ holdLabelFontSize: parseInt(e.target.value) })}
            />
            <div className="text-xs text-base-content/50 text-right mt-1">
              {displayOptions.holdLabelFontSize ?? DEFAULT_DISPLAY_OPTIONS.holdLabelFontSize}px
            </div>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">{intl.formatMessage({ id: 'sidebar.language' })}</span>
            </label>
            <select
              className="select select-bordered select-sm w-full"
              value={config.language ?? 'auto'}
              onChange={(e) => setLanguage(e.target.value as LanguageSetting)}
            >
              {(['auto', 'fr', 'en', 'de', 'it'] as const).map((lang) => (
                <option key={lang} value={lang}>
                  {intl.formatMessage({ id: `language.${lang}` })}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-full md:w-80 bg-base-100 md:border-r border-base-300 md:flex md:flex-col md:overflow-hidden md:h-full">
      <ConfigSelector />
      <WallConfig />
      <SectionList />
      <DisplayOptions />
    </aside>
  );
}
