/**
 * Anchor position configurator component
 */

import { memo, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  PANEL_SIDES,
  type PanelSide,
  type CoordinateSystemId,
  DEFAULT_COORDINATE_SYSTEM,
  INTERNAL_STORAGE_SYSTEM,
  getAnchorColumnOptions,
  getAnchorColumnDisplayLabel,
  getAnchorRowDisplayLabel,
  ANCHOR_ROW_OPTIONS,
} from '@/constants/routes';
import type { AnchorPosition } from './types';

interface AnchorConfiguratorProps {
  anchor: AnchorPosition | undefined;
  defaultAnchor: AnchorPosition;
  onUpdate: (anchor: AnchorPosition) => void;
  onReset: () => void;
  /** Coordinate system for display (columns are stored in INTERNAL_STORAGE_SYSTEM internally) */
  coordinateDisplaySystem?: CoordinateSystemId;
  /** Current lane index (0-based) */
  lane?: number;
  /** Total number of lanes */
  lanesCount?: number;
  /** Callback when lane changes (for wrap navigation and dedicated buttons) */
  onLaneChange?: (lane: number) => void;
}

export const AnchorConfigurator = memo(function AnchorConfigurator({
  anchor,
  defaultAnchor,
  onUpdate,
  onReset,
  coordinateDisplaySystem = DEFAULT_COORDINATE_SYSTEM,
  lane = 0,
  lanesCount = 1,
  onLaneChange,
}: AnchorConfiguratorProps) {
  const intl = useIntl();
  const currentAnchor: AnchorPosition = anchor ?? defaultAnchor;

  // Extended column options: [A-1, A, B, ..., K, K+1] stored in ABC system
  const anchorColumnOptions = useMemo(
    () => getAnchorColumnOptions(INTERNAL_STORAGE_SYSTEM),
    []
  );

  // Current column index in the extended options array
  const currentColumnIndex = useMemo(
    () => anchorColumnOptions.indexOf(currentAnchor.column),
    [anchorColumnOptions, currentAnchor.column]
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

  // Handle column select change: value is stored column (ABC system)
  const handleColumnChange = useCallback(
    (storedValue: string) => {
      updateField('column', storedValue);
    },
    [updateField]
  );

  const lastColumnIndex = anchorColumnOptions.length - 1;

  // Arrow navigation handlers
  const moveUp = useCallback(() => {
    updateField('row', currentAnchor.row + 1);
  }, [currentAnchor.row, updateField]);

  const moveDown = useCallback(() => {
    updateField('row', currentAnchor.row - 1);
  }, [currentAnchor.row, updateField]);

  // Column navigation with cross-panel wrapping:
  // K+1 on one panel ≡ A-1 on the next, so wrap lands on A (index 1) / K (index last-1)
  const moveRight = useCallback(() => {
    if (currentColumnIndex < lastColumnIndex) {
      handleColumnChange(anchorColumnOptions[currentColumnIndex + 1]);
    } else {
      // At K+1: wrap to A on the next panel
      const firstRealColumn = anchorColumnOptions[1]; // A
      if (currentAnchor.side === PANEL_SIDES.LEFT) {
        onUpdate({ ...currentAnchor, side: PANEL_SIDES.RIGHT, column: firstRealColumn });
      } else {
        onUpdate({ ...currentAnchor, side: PANEL_SIDES.LEFT, column: firstRealColumn });
        onLaneChange?.(lane + 1);
      }
    }
  }, [currentColumnIndex, lastColumnIndex, anchorColumnOptions, handleColumnChange, currentAnchor, onUpdate, onLaneChange, lane]);

  const moveLeft = useCallback(() => {
    if (currentColumnIndex > 0) {
      handleColumnChange(anchorColumnOptions[currentColumnIndex - 1]);
    } else {
      // At A-1: wrap to K on the previous panel
      const lastRealColumn = anchorColumnOptions[lastColumnIndex - 1]; // K
      if (currentAnchor.side === PANEL_SIDES.RIGHT) {
        onUpdate({ ...currentAnchor, side: PANEL_SIDES.LEFT, column: lastRealColumn });
      } else {
        onUpdate({ ...currentAnchor, side: PANEL_SIDES.RIGHT, column: lastRealColumn });
        onLaneChange?.(lane - 1);
      }
    }
  }, [currentColumnIndex, lastColumnIndex, anchorColumnOptions, handleColumnChange, currentAnchor, onUpdate, onLaneChange, lane]);

  // Half-lane (panel) navigation: each click moves by one panel side
  const goToPreviousPanel = useCallback(() => {
    if (currentAnchor.side === PANEL_SIDES.RIGHT) {
      // DX → SN (same lane)
      updateField('side', PANEL_SIDES.LEFT);
    } else {
      // SN → previous lane's DX
      updateField('side', PANEL_SIDES.RIGHT);
      onLaneChange?.(lane - 1);
    }
  }, [currentAnchor.side, updateField, onLaneChange, lane]);

  const goToNextPanel = useCallback(() => {
    if (currentAnchor.side === PANEL_SIDES.LEFT) {
      // SN → DX (same lane)
      updateField('side', PANEL_SIDES.RIGHT);
    } else {
      // DX → next lane's SN
      updateField('side', PANEL_SIDES.LEFT);
      onLaneChange?.(lane + 1);
    }
  }, [currentAnchor.side, updateField, onLaneChange, lane]);

  // Layout and disable state
  const hasLaneNav = lanesCount > 1;
  const isUpDisabled = currentAnchor.row >= 11;
  const isDownDisabled = currentAnchor.row <= 0;
  const isRightDisabled = currentColumnIndex >= lastColumnIndex
    && currentAnchor.side === PANEL_SIDES.RIGHT && lane >= lanesCount - 1;
  const isLeftDisabled = currentColumnIndex <= 0
    && currentAnchor.side === PANEL_SIDES.LEFT && lane <= 0;
  const hasPrevPanel = !(currentAnchor.side === PANEL_SIDES.LEFT && lane <= 0);
  const hasNextPanel = !(currentAnchor.side === PANEL_SIDES.RIGHT && lane >= lanesCount - 1);

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
            value={currentAnchor.column}
            onChange={(e) => handleColumnChange(e.target.value)}
          >
            {anchorColumnOptions.map((col) => (
              <option key={col} value={col}>
                {getAnchorColumnDisplayLabel(col, coordinateDisplaySystem)}
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
            {ANCHOR_ROW_OPTIONS.map((row) => (
              <option key={row} value={row}>
                {getAnchorRowDisplayLabel(row)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directional arrow pad with optional lane buttons */}
      <div className="flex justify-center mt-2">
        <div className={`grid ${hasLaneNav ? 'grid-cols-5' : 'grid-cols-3'} gap-0.5`} style={{ width: 'fit-content' }}>
          {hasLaneNav && <div />}
          <div />
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={moveUp}
            disabled={isUpDisabled}
            aria-label={intl.formatMessage({ id: 'section.moveUp' })}
          >
            <ChevronUp size={16} />
          </button>
          <div />
          {hasLaneNav && <div />}

          {hasLaneNav && (
            <button
              className="btn btn-sm btn-square btn-outline"
              onClick={goToPreviousPanel}
              disabled={!hasPrevPanel}
              aria-label={intl.formatMessage({ id: 'section.previousPanel' })}
            >
              <ChevronsLeft size={16} />
            </button>
          )}
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={moveLeft}
            disabled={isLeftDisabled}
            aria-label={intl.formatMessage({ id: 'section.moveLeft' })}
          >
            <ChevronLeft size={16} />
          </button>
          <div />
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={moveRight}
            disabled={isRightDisabled}
            aria-label={intl.formatMessage({ id: 'section.moveRight' })}
          >
            <ChevronRight size={16} />
          </button>
          {hasLaneNav && (
            <button
              className="btn btn-sm btn-square btn-outline"
              onClick={goToNextPanel}
              disabled={!hasNextPanel}
              aria-label={intl.formatMessage({ id: 'section.nextPanel' })}
            >
              <ChevronsRight size={16} />
            </button>
          )}

          {hasLaneNav && <div />}
          <div />
          <button
            className="btn btn-sm btn-square btn-outline"
            onClick={moveDown}
            disabled={isDownDisabled}
            aria-label={intl.formatMessage({ id: 'section.moveDown' })}
          >
            <ChevronDown size={16} />
          </button>
          <div />
          {hasLaneNav && <div />}
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
