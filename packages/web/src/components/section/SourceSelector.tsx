/**
 * Route source selector component
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';
import { ROUTE_INTL_KEYS } from '@/constants/routes';

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
  const intl = useIntl();
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">{intl.formatMessage({ id: 'section.sourceRoute' })}</span>
      </label>
      <select
        className="select select-bordered select-sm w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {routeNames.map((name) => (
          <option key={name} value={name}>
            {ROUTE_INTL_KEYS[name] ? intl.formatMessage({ id: ROUTE_INTL_KEYS[name] }) : name.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
});
