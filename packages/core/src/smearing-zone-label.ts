/**
 * Smearing zone label translation
 *
 * Deliberately a separate namespace from hold labels: `R` means "added foot"
 * on a hold (Indian route) and "Reibung" on a zone (German routes). The two
 * only coexist because the tables never meet — do not merge them.
 */

import { DEFAULT_HOLD_LABEL_LANGUAGE, type HoldLabelLanguage } from './hold-label.js';

/** The single role a zone label carries today */
export type SmearingZoneRole = 'SMEARING_ZONE';

/**
 * Prefix written in route data → role.
 * `A` covers French (Adhérence) and Italian (Aderenza), `R` German (Reibung).
 */
const ROLE_BY_PREFIX: Record<string, SmearingZoneRole> = {
  A: 'SMEARING_ZONE',
  R: 'SMEARING_ZONE',
  S: 'SMEARING_ZONE',
};

/**
 * Role → displayed prefix, per language.
 * English uses `S` (smearing); it is the one prefix backed by no official plan,
 * since no English-language reference route exists.
 */
const PREFIX_BY_ROLE: Record<HoldLabelLanguage, Record<SmearingZoneRole, string>> = {
  fr: { SMEARING_ZONE: 'A' },
  en: { SMEARING_ZONE: 'S' },
  de: { SMEARING_ZONE: 'R' },
  it: { SMEARING_ZONE: 'A' },
};

/** Alphabetic prefix followed by an optional numeric index */
const LABEL_PATTERN = /^([A-Za-z]+)([0-9]*)$/;

/**
 * Parse a smearing zone label into its role and its index
 * @param label - Raw label written in the route data (e.g. 'A1', 'R3')
 * @returns The role and the index preserved verbatim, or undefined when the
 *   label does not match the pattern or its prefix is unknown
 */
export function parseSmearingZoneLabel(
  label: string
): { role: SmearingZoneRole; index: string } | undefined {
  const match = LABEL_PATTERN.exec(label);
  if (!match) {
    return undefined;
  }
  const [, prefix = '', index = ''] = match;
  const role = ROLE_BY_PREFIX[prefix.toUpperCase()];
  if (!role) {
    return undefined;
  }
  return { role, index };
}

/**
 * Translate a smearing zone label into the given language
 * @param label - Raw label written in the route data (e.g. 'A1', 'R3')
 * @param language - Target language
 * @returns The translated label, or the label verbatim when it cannot be parsed
 */
export function formatSmearingZoneLabel(label: string, language: HoldLabelLanguage): string {
  const parsed = parseSmearingZoneLabel(label);
  if (!parsed) {
    return label;
  }
  const prefixes = PREFIX_BY_ROLE[language] ?? PREFIX_BY_ROLE[DEFAULT_HOLD_LABEL_LANGUAGE];
  return `${prefixes[parsed.role]}${parsed.index}`;
}
