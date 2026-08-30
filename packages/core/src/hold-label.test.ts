import { describe, it, expect } from 'vitest';
import { parseHoldLabel, formatHoldLabel, type HoldLabelLanguage, type HoldRole } from './hold-label.js';

const LANGUAGES: HoldLabelLanguage[] = ['fr', 'en', 'de', 'it'];

describe('parseHoldLabel', () => {
  const roleCases: Array<{ label: string; role: HoldRole; index: string }> = [
    { label: 'M1', role: 'HAND', index: '1' },
    { label: 'H1', role: 'HAND', index: '1' },
    { label: 'P3', role: 'FOOT', index: '3' },
    { label: 'F3', role: 'FOOT', index: '3' },
    { label: 'N1', role: 'ADDED_HAND', index: '1' },
    { label: 'I1', role: 'ADDED_HAND', index: '1' },
    { label: 'Q2', role: 'ADDED_FOOT', index: '2' },
    { label: 'G2', role: 'ADDED_FOOT', index: '2' },
    { label: 'R2', role: 'ADDED_FOOT', index: '2' },
    { label: 'PAD', role: 'PAD', index: '' },
  ];

  it.each(roleCases)('should parse $label as $role with index "$index"', ({ label, role, index }) => {
    expect(parseHoldLabel(label)).toEqual({ role, index });
  });

  it('should preserve a multi-digit index verbatim', () => {
    expect(parseHoldLabel('M12')).toEqual({ role: 'HAND', index: '12' });
  });

  it('should normalize the prefix to uppercase before lookup', () => {
    expect(parseHoldLabel('m1')).toEqual({ role: 'HAND', index: '1' });
    expect(parseHoldLabel('pad')).toEqual({ role: 'PAD', index: '' });
  });

  it('should return undefined for an unknown prefix', () => {
    expect(parseHoldLabel('Z1')).toBeUndefined();
  });

  it('should return undefined for a label that does not match the pattern', () => {
    expect(parseHoldLabel('M1-A')).toBeUndefined();
    expect(parseHoldLabel('1M')).toBeUndefined();
    expect(parseHoldLabel('')).toBeUndefined();
  });
});

describe('formatHoldLabel', () => {
  const translations: Array<{ role: HoldRole; label: string; fr: string; en: string; de: string; it: string }> = [
    { role: 'HAND', label: 'M1', fr: 'M1', en: 'H1', de: 'H1', it: 'M1' },
    { role: 'FOOT', label: 'P3', fr: 'P3', en: 'F3', de: 'F3', it: 'P3' },
    { role: 'ADDED_HAND', label: 'N1', fr: 'N1', en: 'I1', de: 'I1', it: 'N1' },
    { role: 'ADDED_FOOT', label: 'Q2', fr: 'Q2', en: 'G2', de: 'G2', it: 'Q2' },
    { role: 'PAD', label: 'PAD', fr: 'PAD', en: 'PAD', de: 'PAD', it: 'PAD' },
  ];

  for (const language of LANGUAGES) {
    it.each(translations)(`should render a $role label in ${language}`, (testCase) => {
      expect(formatHoldLabel(testCase.label, language)).toBe(testCase[language]);
    });
  }

  it('should keep PAD invariant across languages', () => {
    for (const language of LANGUAGES) {
      expect(formatHoldLabel('PAD', language)).toBe('PAD');
    }
  });

  it('should preserve a multi-digit index', () => {
    expect(formatHoldLabel('M12', 'en')).toBe('H12');
    expect(formatHoldLabel('H12', 'fr')).toBe('M12');
  });

  it('should retranslate a label already written in another language', () => {
    // Existing German/Italian/Indian route data uses H/F/I/G and R
    expect(formatHoldLabel('H1', 'fr')).toBe('M1');
    expect(formatHoldLabel('F2', 'fr')).toBe('P2');
    expect(formatHoldLabel('I1', 'fr')).toBe('N1');
    expect(formatHoldLabel('G3', 'fr')).toBe('Q3');
    expect(formatHoldLabel('R3', 'fr')).toBe('Q3');
    expect(formatHoldLabel('M1', 'de')).toBe('H1');
  });

  it('should render an unknown prefix verbatim', () => {
    for (const language of LANGUAGES) {
      expect(formatHoldLabel('Z1', language)).toBe('Z1');
    }
  });

  it('should render a label that does not match the pattern verbatim', () => {
    expect(formatHoldLabel('M1-A', 'en')).toBe('M1-A');
    expect(formatHoldLabel('1M', 'en')).toBe('1M');
    expect(formatHoldLabel('', 'en')).toBe('');
  });

  it('should not throw on any input', () => {
    expect(() => formatHoldLabel('???', 'en')).not.toThrow();
  });

  // A caller spreading a partial options object — `{ holdLabelLanguage: prefs?.lang }`
  // — reaches this with no language; falling back beats crashing the whole render.
  it('should fall back to the default language when none is given', () => {
    const noLanguage = undefined as unknown as HoldLabelLanguage;
    expect(formatHoldLabel('H1', noLanguage)).toBe('M1');
    expect(formatHoldLabel('PAD', noLanguage)).toBe('PAD');
  });
});
