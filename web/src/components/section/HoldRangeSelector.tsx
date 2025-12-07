/**
 * Hold range selector with crosshair selection buttons
 */

import { memo } from 'react';
import { Crosshair, X } from 'lucide-react';

interface HoldSelectorProps {
  label: string;
  value: string | number;
  holdLabels: string[];
  isSelecting: boolean;
  onValueChange: (value: string) => void;
  onToggleSelect: () => void;
}

const HoldSelector = memo(function HoldSelector({
  label,
  value,
  holdLabels,
  isSelecting,
  onValueChange,
  onToggleSelect,
}: HoldSelectorProps) {
  return (
    <div className="form-control">
      <label className="label py-0.5">
        <span className="label-text text-xs">{label}</span>
      </label>
      <div className="flex gap-1">
        <select
          className="select select-bordered select-xs flex-1 min-w-0"
          value={String(value)}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {holdLabels.map((holdLabel) => (
            <option key={holdLabel} value={holdLabel}>
              {holdLabel}
            </option>
          ))}
        </select>
        <button
          className={`btn btn-xs btn-square ${isSelecting ? 'btn-primary' : 'btn-ghost'}`}
          title={isSelecting ? 'Annuler' : 'Sélectionner sur le mur'}
          onClick={onToggleSelect}
        >
          {isSelecting ? <X size={14} /> : <Crosshair size={14} />}
        </button>
      </div>
    </div>
  );
});

interface HoldRangeSelectorProps {
  fromHold: string | number;
  toHold: string | number;
  holdLabels: string[];
  isSelectingFrom: boolean;
  isSelectingTo: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onToggleSelectFrom: () => void;
  onToggleSelectTo: () => void;
}

export const HoldRangeSelector = memo(function HoldRangeSelector({
  fromHold,
  toHold,
  holdLabels,
  isSelectingFrom,
  isSelectingTo,
  onFromChange,
  onToChange,
  onToggleSelectFrom,
  onToggleSelectTo,
}: HoldRangeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <HoldSelector
        label="Première prise"
        value={fromHold}
        holdLabels={holdLabels}
        isSelecting={isSelectingFrom}
        onValueChange={onFromChange}
        onToggleSelect={onToggleSelectFrom}
      />
      <HoldSelector
        label="Dernière prise"
        value={toHold}
        holdLabels={holdLabels}
        isSelecting={isSelectingTo}
        onValueChange={onToChange}
        onToggleSelect={onToggleSelectTo}
      />
    </div>
  );
});
