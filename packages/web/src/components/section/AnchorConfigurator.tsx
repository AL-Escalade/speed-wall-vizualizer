/**
 * Anchor position configurator component
 */

import { memo, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  PANEL_SIDES,
  ROW_COUNT,
  type PanelSide,
  type CoordinateSystemId,
  DEFAULT_COORDINATE_SYSTEM,
  INTERNAL_STORAGE_SYSTEM,
  getColumnLabelsForSystem,
  convertColumn,
} from '@/constants/routes';
import type { AnchorPosition } from './types';

/** Pre-computed row options (1-10) */
const ROW_OPTIONS = Array.from({ length: ROW_COUNT }, (_, i) => i + 1);

interface AnchorConfiguratorProps {
  anchor: AnchorPosition | undefined;
  defaultAnchor: AnchorPosition;
  onUpdate: (anchor: AnchorPosition) => void;
  onReset: () => void;
  /** Coordinate system for display (columns are stored in INTERNAL_STORAGE_SYSTEM internally) */
  coordinateDisplaySystem?: CoordinateSystemId;
}

export const AnchorConfigurator = memo(function AnchorConfigurator({
  anchor,
  defaultAnchor,
  onUpdate,
  onReset,
  coordinateDisplaySystem = DEFAULT_COORDINATE_SYSTEM,
}: AnchorConfiguratorProps) {
  const intl = useIntl();
  const currentAnchor: AnchorPosition = anchor ?? defaultAnchor;

  // Get column labels for the display coordinate system
  const columnLabels = useMemo(
    () => getColumnLabelsForSystem(coordinateDisplaySystem),
    [coordinateDisplaySystem]
  );

  // Convert stored column (INTERNAL_STORAGE_SYSTEM = ABC) to display column
  const displayColumn = useMemo(
    () => convertColumn(currentAnchor.column, INTERNAL_STORAGE_SYSTEM, coordinateDisplaySystem),
    [currentAnchor.column, coordinateDisplaySystem]
  );

  const updateField = useCallback(
    <K extends keyof AnchorPosition>(field: K, value: AnchorPosition[K]) => {
      onUpdate({
        ...currentAnchor,
        [field]: value,
      });
    },
    [currentAnchor, onUpdate]
  );

  // Handle column change: convert from display system to internal storage (ABC)
  const handleColumnChange = useCallback(
    (displayValue: string) => {
      const storedValue = convertColumn(displayValue, coordinateDisplaySystem, INTERNAL_STORAGE_SYSTEM);
      updateField('column', storedValue);
    },
    [coordinateDisplaySystem, updateField]
  );

  return (
    <>
      <div className="form-control">
        <label className="label py-1">
          <span className="label-text text-sm">{intl.formatMessage({ id: 'section.anchorPosition' })}</span>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">{intl.formatMessage({ id: 'section.side' })}</span>
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={currentAnchor.side}
            onChange={(e) => updateField('side', e.target.value as PanelSide)}
          >
            <option value={PANEL_SIDES.LEFT}>{intl.formatMessage({ id: 'section.left' })}</option>
            <option value={PANEL_SIDES.RIGHT}>{intl.formatMessage({ id: 'section.right' })}</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">{intl.formatMessage({ id: 'section.column' })}</span>
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={displayColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
          >
            {columnLabels.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">{intl.formatMessage({ id: 'section.row' })}</span>
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={currentAnchor.row}
            onChange={(e) => updateField('row', parseInt(e.target.value))}
          >
            {ROW_OPTIONS.map((row) => (
              <option key={row} value={row}>
                {row}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="btn btn-sm btn-ghost mt-2"
        onClick={onReset}
        title={intl.formatMessage({ id: 'section.resetAnchor' })}
      >
        {intl.formatMessage({ id: 'section.reset' })}
      </button>
    </>
  );
});
