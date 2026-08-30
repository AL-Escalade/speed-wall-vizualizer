/**
 * Hold range selector with dropdowns for first and last hold
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';
import { formatHoldLabel, type HoldLabelLanguage } from '@voie-vitesse/core';
import { useHoldLabelLanguage } from '@/i18n/useHoldLabelLanguage';

interface HoldSelectorProps {
  label: string;
  value: string | number;
  holdLabels: string[];
  holdLabelLanguage: HoldLabelLanguage;
  onValueChange: (value: string) => void;
}

const HoldSelector = memo(function HoldSelector({
  label,
  value,
  holdLabels,
  holdLabelLanguage,
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
        {/* Value stays the raw route label (configuration identity), only the text is translated */}
        {holdLabels.map((holdLabel) => (
          <option key={holdLabel} value={holdLabel}>
            {formatHoldLabel(holdLabel, holdLabelLanguage)}
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
  const intl = useIntl();
  const holdLabelLanguage = useHoldLabelLanguage();
  return (
    <div className="grid grid-cols-2 gap-2">
      <HoldSelector
        label={intl.formatMessage({ id: 'section.firstHold' })}
        value={fromHold}
        holdLabels={holdLabels}
        holdLabelLanguage={holdLabelLanguage}
        onValueChange={onFromChange}
      />
      <HoldSelector
        label={intl.formatMessage({ id: 'section.lastHold' })}
        value={toHold}
        holdLabels={holdLabels}
        holdLabelLanguage={holdLabelLanguage}
        onValueChange={onToChange}
      />
    </div>
  );
});
