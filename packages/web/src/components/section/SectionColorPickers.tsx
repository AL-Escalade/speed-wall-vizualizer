/**
 * One color picker per color tag declared by the section's reference route.
 *
 * A single-color route yields exactly one tag, so this renders the same single
 * picker the section panel has always shown.
 */

import { memo } from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_COLOR_TAG } from '@voie-vitesse/core';
import { ColorPicker } from './ColorPicker';

interface SectionColorPickersProps {
  /** Color tags of the route, in declaration order */
  tags: string[];
  /** Effective color per tag: route colors with the section's overrides applied */
  values: Record<string, string>;
  /** Whether the user has overridden at least one color */
  isCustomized: boolean;
  onChange: (tag: string, color: string) => void;
  onReset: () => void;
}

export const SectionColorPickers = memo(function SectionColorPickers({
  tags,
  values,
  isCustomized,
  onChange,
  onReset,
}: SectionColorPickersProps) {
  const intl = useIntl();

  // A route declaring one color has nothing to name: keep the generic caption
  const labelFor = (tag: string) =>
    tags.length === 1 && tag === DEFAULT_COLOR_TAG
      ? undefined
      : intl.formatMessage({ id: `section.colorTag.${tag}`, defaultMessage: tag });

  return (
    <div className="space-y-1">
      {tags.map((tag) => (
        <ColorPicker
          key={tag}
          label={labelFor(tag)}
          value={values[tag]}
          onChange={(color) => onChange(tag, color)}
        />
      ))}

      {isCustomized && (
        <button
          className="btn btn-xs btn-ghost"
          onClick={onReset}
          title={intl.formatMessage({ id: 'section.resetColorsHint' })}
        >
          {intl.formatMessage({ id: 'section.resetColors' })}
        </button>
      )}
    </div>
  );
});
