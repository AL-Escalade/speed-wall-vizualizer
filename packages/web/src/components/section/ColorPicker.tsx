/**
 * Color picker component
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
}: ColorPickerProps) {
  const intl = useIntl();
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">{intl.formatMessage({ id: 'section.color' })}</span>
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg cursor-pointer border border-base-300"
      />
    </div>
  );
});
