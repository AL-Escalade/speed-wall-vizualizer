/**
 * Hold range selector with dropdowns for first and last hold
 */

import { memo } from 'react';

interface HoldSelectorProps {
  label: string;
  value: string | number;
  holdLabels: string[];
  onValueChange: (value: string) => void;
}

const HoldSelector = memo(function HoldSelector({
  label,
  value,
  holdLabels,
  onValueChange,
}: HoldSelectorProps) {
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">{label}</span>
      </label>
      <select
        className="select select-bordered select-sm w-full"
        value={String(value)}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {holdLabels.map((holdLabel) => (
          <option key={holdLabel} value={holdLabel}>
            {holdLabel}
          </option>
        ))}
      </select>
    </div>
  );
});

interface HoldRangeSelectorProps {
  fromHold: string | number;
  toHold: string | number;
  holdLabels: string[];
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export const HoldRangeSelector = memo(function HoldRangeSelector({
  fromHold,
  toHold,
  holdLabels,
  onFromChange,
  onToChange,
}: HoldRangeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <HoldSelector
        label="Première prise"
        value={fromHold}
        holdLabels={holdLabels}
        onValueChange={onFromChange}
      />
      <HoldSelector
        label="Dernière prise"
        value={toHold}
        holdLabels={holdLabels}
        onValueChange={onToChange}
      />
    </div>
  );
});
