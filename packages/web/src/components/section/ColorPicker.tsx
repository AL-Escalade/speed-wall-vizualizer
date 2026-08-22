/**
 * Color picker component
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Overrides the default "Color" caption, e.g. with a color tag name */
  label?: string;
}

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
  label,
}: ColorPickerProps) {
  const intl = useIntl();
  return (
    <div className="form-control">
      <label className="label py-1">
        <span className="label-text text-sm">
          {label ?? intl.formatMessage({ id: 'section.color' })}
        </span>
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
