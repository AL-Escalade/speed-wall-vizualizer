/**
 * Bridge between the application locale and the language used to render hold
 * label prefixes (`@M1` -> `M1` in French, `H1` in English).
 *
 * Single conversion point: the interface locale is presentation, the raw label
 * written in the route data stays the identity used by stored configurations.
 */

import { useIntl } from 'react-intl';
import type { HoldLabelLanguage } from '@voie-vitesse/core';
import { DEFAULT_LOCALE, type SupportedLocale } from './index';

/**
 * Total map from the locales the application supports to the languages the core
 * knows how to render. Adding a locale to `SupportedLocale` without adding it to
 * the core's `HoldLabelLanguage` union fails to compile here.
 */
const HOLD_LABEL_LANGUAGES: Record<SupportedLocale, HoldLabelLanguage> = {
  fr: 'fr',
  de: 'de',
  it: 'it',
  en: 'en',
};

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return Object.hasOwn(HOLD_LABEL_LANGUAGES, locale);
}

/**
 * Language used to display hold labels, derived from the active interface locale.
 */
export function useHoldLabelLanguage(): HoldLabelLanguage {
  const { locale } = useIntl();
  return HOLD_LABEL_LANGUAGES[isSupportedLocale(locale) ? locale : DEFAULT_LOCALE];
}
