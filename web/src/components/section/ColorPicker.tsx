/**
 * Color picker component
 */

import { memo } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
}: ColorPickerProps) {
  return (
    <div className="form-control">
      <label className="label py-0.5">
        <span className="label-text text-xs">Couleur</span>
      </label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 rounded cursor-pointer border border-base-300"
      />
    </div>
  );
});
