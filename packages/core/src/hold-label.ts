/**
 * Hold label roles and translation
 *
 * A hold label such as `M1`, `P3`, `N1`, `Q2` or `PAD` is a presentation of a
 * semantic role, not data: the raw label written in the route data stays the
 * identity key (configs reference it), only the displayed prefix is translated.
 */

/** Semantic role carried by a hold label prefix */
export type HoldRole = 'HAND' | 'FOOT' | 'ADDED_HAND' | 'ADDED_FOOT' | 'PAD';

/** Language a hold label can be displayed in */
export type HoldLabelLanguage = 'fr' | 'en' | 'de' | 'it';

/**
 * Prefix written in route data → role.
 * Global namespace: French (M/P/N/Q), English & German (H/F/I/G) and the
 * Indian route's R all resolve here without collision.
 */
const ROLE_BY_PREFIX: Record<string, HoldRole> = {
  M: 'HAND',
  H: 'HAND',
  P: 'FOOT',
  F: 'FOOT',
  N: 'ADDED_HAND',
  I: 'ADDED_HAND',
  Q: 'ADDED_FOOT',
  G: 'ADDED_FOOT',
  R: 'ADDED_FOOT',
  PAD: 'PAD',
};

/**
 * Role → displayed prefix, per language.
 * German follows English (Hand, Fuß), Italian follows French (Mano, Piede).
 * Typed as a total Record so a missing language or role fails to compile.
 */
const PREFIX_BY_ROLE: Record<HoldLabelLanguage, Record<HoldRole, string>> = {
  fr: { HAND: 'M', FOOT: 'P', ADDED_HAND: 'N', ADDED_FOOT: 'Q', PAD: 'PAD' },
  en: { HAND: 'H', FOOT: 'F', ADDED_HAND: 'I', ADDED_FOOT: 'G', PAD: 'PAD' },
  de: { HAND: 'H', FOOT: 'F', ADDED_HAND: 'I', ADDED_FOOT: 'G', PAD: 'PAD' },
  it: { HAND: 'M', FOOT: 'P', ADDED_HAND: 'N', ADDED_FOOT: 'Q', PAD: 'PAD' },
};

/** Language assumed when none is given */
export const DEFAULT_HOLD_LABEL_LANGUAGE: HoldLabelLanguage = 'fr';

/** Alphabetic prefix followed by an optional numeric index */
const LABEL_PATTERN = /^([A-Za-z]+)([0-9]*)$/;

/**
 * Parse a hold label into its semantic role and its index
 * @param label - Raw label written in the route data (e.g. 'M1', 'PAD')
 * @returns The role and the index preserved verbatim, or undefined when the
 *   label does not match the pattern or its prefix is unknown
 */
export function parseHoldLabel(label: string): { role: HoldRole; index: string } | undefined {
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
 * Translate a hold label into the given language
 * @param label - Raw label written in the route data (e.g. 'M1', 'H1', 'PAD')
 * @param language - Target language
 * @returns The translated label, or the label verbatim when it cannot be parsed
 */
export function formatHoldLabel(label: string, language: HoldLabelLanguage): string {
  const parsed = parseHoldLabel(label);
  if (!parsed) {
    return label;
  }
  // A caller spreading a partial options object reaches this with an undefined
  // language; fall back to the documented default rather than crash the render.
  const prefixes = PREFIX_BY_ROLE[language] ?? PREFIX_BY_ROLE[DEFAULT_HOLD_LABEL_LANGUAGE];
  return `${prefixes[parsed.role]}${parsed.index}`;
}
