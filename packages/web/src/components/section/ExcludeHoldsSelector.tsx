/**
 * Collapsible checkbox list for excluding individual holds from a section
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { formatHoldLabel } from '@voie-vitesse/core';
import type { HoldLabel } from '@/store/types';
import { useHoldLabelLanguage } from '@/i18n/useHoldLabelLanguage';

interface ExcludeHoldsSelectorProps {
  holdLabels: HoldLabel[];
  excludeHolds: HoldLabel[];
  onChange: (excluded: HoldLabel[]) => void;
}

export const ExcludeHoldsSelector = memo(function ExcludeHoldsSelector({
  holdLabels,
  excludeHolds,
  onChange,
}: ExcludeHoldsSelectorProps) {
  const intl = useIntl();
  const holdLabelLanguage = useHoldLabelLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Filter out stale holds that are no longer in the current range
  const validExcludeHolds = useMemo(() => {
    const labelSet = new Set<string>(holdLabels);
    return excludeHolds.filter((h) => labelSet.has(h));
  }, [holdLabels, excludeHolds]);

  const handleToggle = useCallback(
    (label: string) => {
      const next = validExcludeHolds.includes(label)
        ? validExcludeHolds.filter((h) => h !== label)
        : [...validExcludeHolds, label];
      onChange(next as HoldLabel[]);
    },
    [validExcludeHolds, onChange]
  );

  // Displayed text only: the excluded holds are stored with their raw route labels
  const summary =
    validExcludeHolds.length > 0
      ? validExcludeHolds.map((label) => formatHoldLabel(label, holdLabelLanguage)).join(', ')
      : intl.formatMessage({ id: 'section.excludeHoldsPlaceholder' });

  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">
          {intl.formatMessage({ id: 'section.excludeHolds' })}
        </span>
      </label>
      <button
        type="button"
        className="select select-bordered select-sm w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{summary}</span>
      </button>
      {isOpen && (
        <div className="border border-base-300 rounded-b-lg max-h-48 overflow-y-auto p-2 -mt-px">
          <div className="grid grid-cols-3 gap-1">
            {holdLabels.map((label) => (
              <label key={label} className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5 rounded hover:bg-base-300">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={validExcludeHolds.includes(label)}
                  onChange={() => handleToggle(label)}
                />
                {/* State and callbacks keep the raw route label, only the text is translated */}
                <span className="text-xs">{formatHoldLabel(label, holdLabelLanguage)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
