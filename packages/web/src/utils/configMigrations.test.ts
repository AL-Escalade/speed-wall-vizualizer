import { describe, it, expect } from 'vitest';
import { CONFIG_SCHEMA_VERSION, migrateSectionSource } from './configMigrations';

describe('migrateSectionSource', () => {
  const section = (source: string) => ({ source, lane: 0 });

  it.each([
    ['u15-it', 'u15-de'],
    ['u11-u13-de-it', 'u11-u13-de'],
  ])('should rename %s in an unversioned payload', (before, after) => {
    expect(migrateSectionSource(section(before), undefined).source).toBe(after);
  });

  it('should match route ids case-insensitively, as the composer does', () => {
    expect(migrateSectionSource(section('U15-IT'), undefined).source).toBe('u15-de');
  });

  // The whole point of the version: u15-it now means the Italian route
  it('should leave a current payload untouched', () => {
    expect(migrateSectionSource(section('u15-it'), CONFIG_SCHEMA_VERSION).source).toBe('u15-it');
  });

  it('should leave a source no version renamed untouched', () => {
    expect(migrateSectionSource(section('ifsc'), undefined).source).toBe('ifsc');
  });

  it('should preserve the other fields of the section', () => {
    expect(migrateSectionSource({ source: 'u15-it', lane: 3 }, undefined)).toEqual({
      source: 'u15-de',
      lane: 3,
    });
  });
});
