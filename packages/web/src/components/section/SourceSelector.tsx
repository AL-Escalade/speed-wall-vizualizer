/**
 * Route source selector component
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';
import { ROUTE_INTL_KEYS } from '@/constants/routes';

interface SourceSelectorProps {
  value: string;
  routeNames: string[];
  /** Official route plan of the selected route. Absent for routes with no published plan. */
  referenceUrl?: string;
  onChange: (source: string) => void;
}

export const SourceSelector = memo(function SourceSelector({
  value,
  routeNames,
  referenceUrl,
  onChange,
}: SourceSelectorProps) {
  const intl = useIntl();
  const referenceLabel = intl.formatMessage({ id: 'section.officialPlan' });
  return (
    <div className="form-control">
      <label className="label py-1 justify-between">
        <span className="label-text text-sm">{intl.formatMessage({ id: 'section.sourceRoute' })}</span>
        {referenceUrl && (
          <a
            className="link link-primary text-xs inline-flex items-center gap-1"
            href={referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={referenceLabel}
            aria-label={referenceLabel}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            {referenceLabel}
          </a>
        )}
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
