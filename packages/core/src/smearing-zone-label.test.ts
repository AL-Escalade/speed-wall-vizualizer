import { describe, it, expect } from 'vitest';
import { parseSmearingZoneLabel, formatSmearingZoneLabel } from './smearing-zone-label.js';
import type { HoldLabelLanguage } from './hold-label.js';

const LANGUAGES: HoldLabelLanguage[] = ['fr', 'en', 'de', 'it'];

describe('parseSmearingZoneLabel', () => {
  it('should resolve every prefix the shipped routes use', () => {
    expect(parseSmearingZoneLabel('A1')).toEqual({ role: 'SMEARING_ZONE', index: '1' });
    expect(parseSmearingZoneLabel('R3')).toEqual({ role: 'SMEARING_ZONE', index: '3' });
  });

  it('should return undefined for an unknown prefix', () => {
    expect(parseSmearingZoneLabel('Z1')).toBeUndefined();
  });
});

describe('formatSmearingZoneLabel', () => {
  it('should translate the prefix and keep the index', () => {
    expect(formatSmearingZoneLabel('A1', 'fr')).toBe('A1');
    expect(formatSmearingZoneLabel('A1', 'en')).toBe('S1');
    expect(formatSmearingZoneLabel('A1', 'de')).toBe('R1');
    expect(formatSmearingZoneLabel('A1', 'it')).toBe('A1');
  });

  // The German routes write their zones as R*, so a French reader must see A*
  it('should retranslate an already-translated label', () => {
    expect(formatSmearingZoneLabel('R3', 'fr')).toBe('A3');
    expect(formatSmearingZoneLabel('R3', 'it')).toBe('A3');
    expect(formatSmearingZoneLabel('A3', 'de')).toBe('R3');
  });

  // R is "added foot" for a hold and "Reibung" for a zone: separate namespaces
  it('should read R as a zone prefix, not as the hold role it also spells', () => {
    expect(formatSmearingZoneLabel('R14', 'en')).toBe('S14');
  });

  it('should render an unknown prefix verbatim', () => {
    for (const language of LANGUAGES) {
      expect(formatSmearingZoneLabel('Z1', language)).toBe('Z1');
      expect(formatSmearingZoneLabel('Zone A', language)).toBe('Zone A');
    }
  });

  it('should fall back to the default language when none is given', () => {
    expect(formatSmearingZoneLabel('R3', undefined as unknown as HoldLabelLanguage)).toBe('A3');
  });
});
