/**
 * i18n setup module
 * Provides locale resolution and IntlProvider configuration
 */

import frMessages from './fr.json';
import deMessages from './de.json';
import itMessages from './it.json';
import enMessages from './en.json';

export type SupportedLocale = 'fr' | 'de' | 'it' | 'en';
export type LanguageSetting = 'auto' | SupportedLocale;

const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'de', 'it', 'en'];
const DEFAULT_LOCALE: SupportedLocale = 'fr';

const messages: Record<SupportedLocale, Record<string, string>> = {
  fr: frMessages,
  de: deMessages,
  it: itMessages,
  en: enMessages,
};

/**
 * Detect the browser's preferred locale from navigator.language.
 * Returns the first supported locale found, or 'fr' as fallback.
 */
export function detectBrowserLocale(): SupportedLocale {
  const browserLangs = navigator.languages ?? [navigator.language];

  for (const lang of browserLangs) {
    // Extract base language (e.g., 'de-CH' -> 'de')
    const base = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) {
      return base as SupportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Resolve the effective locale from a language setting.
 * - 'auto': detect from browser
 * - explicit locale: use as-is
 */
export function resolveLocale(language: LanguageSetting): SupportedLocale {
  if (language === 'auto') {
    return detectBrowserLocale();
  }
  return language;
}

/**
 * Get the messages for a given locale.
 * Falls back to French if the locale is somehow not found.
 */
export function getMessages(locale: SupportedLocale): Record<string, string> {
  return messages[locale] ?? messages[DEFAULT_LOCALE];
}

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
