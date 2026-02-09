/**
 * Lane selector component
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';

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
  const intl = useIntl();
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">{intl.formatMessage({ id: 'section.lane' })}</span>
      </label>
      <select
        className="select select-bordered select-sm w-full"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      >
        {Array.from({ length: lanesCount }, (_, i) => (
          <option key={i} value={i}>
            {intl.formatMessage({ id: 'section.laneNumber' }, { number: i + 1 })}
          </option>
        ))}
      </select>
    </div>
  );
});
