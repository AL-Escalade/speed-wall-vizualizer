/**
 * Parsing of the --lang option.
 *
 * Kept out of cli.ts, which calls main() on import and therefore cannot be
 * imported by a test.
 */

import type { HoldLabelLanguage } from '@voie-vitesse/core';

/** Languages hold labels can be rendered in, in the order the usage text lists them */
export const HOLD_LABEL_LANGUAGES: readonly HoldLabelLanguage[] = ['fr', 'en', 'de', 'it'];

/**
 * Validate a --lang value
 * @param value - Raw value given on the command line
 * @returns The language
 * @throws When the value is missing or not a supported language
 */
export function parseLanguage(value: string | undefined): HoldLabelLanguage {
  const language = value?.toLowerCase() as HoldLabelLanguage | undefined;

  if (!language || !HOLD_LABEL_LANGUAGES.includes(language)) {
    throw new Error(
      `Invalid language: "${value ?? ''}". Accepted languages: ${HOLD_LABEL_LANGUAGES.join(', ')}`
    );
  }

  return language;
}
