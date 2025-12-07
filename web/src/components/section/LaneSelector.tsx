/**
 * Lane selector component
 */

import { memo } from 'react';

interface LaneSelectorProps {
  value: number;
  lanesCount: number;
  onChange: (lane: number) => void;
}

export const LaneSelector = memo(function LaneSelector({
  value,
  lanesCount,
  onChange,
}: LaneSelectorProps) {
  return (
    <div className="form-control">
      <label className="label py-0.5">
        <span className="label-text text-xs">Couloir</span>
      </label>
      <select
        className="select select-bordered select-xs w-full"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        {Array.from({ length: lanesCount }, (_, i) => (
          <option key={i} value={i}>
            Couloir {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
});
