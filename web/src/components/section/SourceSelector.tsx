/**
 * Route source selector component
 */

import { memo } from 'react';
import { ROUTE_DISPLAY_NAMES } from '@/constants/routes';

interface SourceSelectorProps {
  value: string;
  routeNames: string[];
  onChange: (source: string) => void;
}

export const SourceSelector = memo(function SourceSelector({
  value,
  routeNames,
  onChange,
}: SourceSelectorProps) {
  return (
    <div className="form-control">
      <label className="label py-0.5">
        <span className="label-text text-xs">Voie source</span>
      </label>
      <select
        className="select select-bordered select-xs w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {routeNames.map((name) => (
          <option key={name} value={name}>
            {ROUTE_DISPLAY_NAMES[name] ?? name.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
});
