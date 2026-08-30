import { describe, it, expect } from 'vitest';
import { HOLD_LABEL_LANGUAGES, parseLanguage } from './hold-label-language.js';

describe('parseLanguage', () => {
  it('should accept every supported language', () => {
    for (const language of HOLD_LABEL_LANGUAGES) {
      expect(parseLanguage(language)).toBe(language);
    }
  });

  it('should accept a language whatever its case', () => {
    expect(parseLanguage('EN')).toBe('en');
    expect(parseLanguage('De')).toBe('de');
  });

  it('should reject an unsupported language, listing the accepted ones', () => {
    expect(() => parseLanguage('es')).toThrow(
      'Invalid language: "es". Accepted languages: fr, en, de, it'
    );
  });

  it('should reject a missing value, as when --lang ends the command line', () => {
    expect(() => parseLanguage(undefined)).toThrow('Accepted languages: fr, en, de, it');
    expect(() => parseLanguage('')).toThrow('Accepted languages: fr, en, de, it');
  });
});
