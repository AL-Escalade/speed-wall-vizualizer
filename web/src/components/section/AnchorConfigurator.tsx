/**
 * Anchor position configurator component
 */

import { memo, useCallback } from 'react';
import { PANEL_SIDES, COLUMN_LABELS, ROW_COUNT, type PanelSide } from '@/constants/routes';
import type { AnchorPosition } from './types';

interface AnchorConfiguratorProps {
  anchor: AnchorPosition | undefined;
  defaultAnchor: AnchorPosition;
  onUpdate: (anchor: AnchorPosition) => void;
  onReset: () => void;
}

export const AnchorConfigurator = memo(function AnchorConfigurator({
  anchor,
  defaultAnchor,
  onUpdate,
  onReset,
}: AnchorConfiguratorProps) {
  const currentAnchor: AnchorPosition = anchor ?? defaultAnchor;

  const updateField = useCallback(
    <K extends keyof AnchorPosition>(field: K, value: AnchorPosition[K]) => {
      onUpdate({
        ...currentAnchor,
        [field]: value,
      });
    },
    [currentAnchor, onUpdate]
  );

  return (
    <>
      <div className="form-control">
        <label className="label py-0.5">
          <span className="label-text text-xs">Position de la première prise</span>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs">Côté</span>
          </label>
          <select
            className="select select-bordered select-xs w-full"
            value={currentAnchor.side}
            onChange={(e) => updateField('side', e.target.value as PanelSide)}
          >
            <option value={PANEL_SIDES.LEFT}>Gauche</option>
            <option value={PANEL_SIDES.RIGHT}>Droite</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs">Colonne</span>
          </label>
          <select
            className="select select-bordered select-xs w-full"
            value={currentAnchor.column}
            onChange={(e) => updateField('column', e.target.value)}
          >
            {COLUMN_LABELS.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label className="label py-0.5">
            <span className="label-text text-xs">Ligne</span>
          </label>
          <select
            className="select select-bordered select-xs w-full"
            value={currentAnchor.row}
            onChange={(e) => updateField('row', parseInt(e.target.value))}
          >
            {Array.from({ length: ROW_COUNT }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="btn btn-xs btn-ghost mt-1"
        onClick={onReset}
        title="Réinitialiser à la position d'origine"
      >
        Réinitialiser
      </button>
    </>
  );
});
