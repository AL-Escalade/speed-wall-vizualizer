/**
 * Display options component
 * Allows configuring visual display settings
 */

import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore, DEFAULT_DISPLAY_OPTIONS } from '@/store';
import { useDebouncedColor } from '@/hooks/useDebouncedColor';
import {
  COORDINATE_SYSTEM_NAMES,
  DEFAULT_COORDINATE_SYSTEM,
  type CoordinateSystemId,
} from '@/constants/routes';

export function DisplayOptions() {
  const config = useConfigStore((s) =>
    s.configurations.find((c) => c.id === s.activeConfigId) ?? null
  );
  const { updateDisplayOptions, setShowArrow, setCoordinateDisplaySystem } = useConfigStore(
    useShallow((s) => ({
      updateDisplayOptions: s.updateDisplayOptions,
      setShowArrow: s.setShowArrow,
      setCoordinateDisplaySystem: s.setCoordinateDisplaySystem,
    }))
  );
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the debounced color hook for grid color
  const displayOptions = config?.displayOptions ?? {};
  const handleGridColorUpdate = useCallback(
    (color: string) => {
      updateDisplayOptions({ gridColor: color });
    },
    [updateDisplayOptions]
  );
  const [localGridColor, handleGridColorChange] = useDebouncedColor(
    displayOptions.gridColor ?? DEFAULT_DISPLAY_OPTIONS.gridColor,
    handleGridColorUpdate
  );

  if (!config) return null;

  return (
    <div className="border-t border-base-300">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between hover:bg-base-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold">Options</h3>
        <ChevronDown
          size={16}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">Système de coordonnées</span>
            </label>
            <select
              className="select select-bordered select-sm w-full"
              value={config.coordinateDisplaySystem ?? DEFAULT_COORDINATE_SYSTEM}
              onChange={(e) => setCoordinateDisplaySystem(e.target.value as CoordinateSystemId)}
            >
              {Object.entries(COORDINATE_SYSTEM_NAMES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
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
              <span className="label-text text-sm">Afficher les flèches d'orientation</span>
            </label>
          </div>
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-sm">Couleur de la grille</span>
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
              <span className="label-text text-sm">Taille des coordonnées</span>
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
              <span className="label-text text-sm">Taille des noms de prises</span>
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
        </div>
      )}
    </div>
  );
}
