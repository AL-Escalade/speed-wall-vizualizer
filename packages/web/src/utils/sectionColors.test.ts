import { describe, it, expect } from 'vitest';
import {
  migrateSectionColors,
  resolveSectionColors,
  isSectionColorCustomized,
} from './sectionColors';
import type { Section } from '@/store/types';

const SINGLE_COLOR = { DEFAULT: '#00AAFF' };
const MULTI_COLOR = { RED: '#FF0000', DARKGREEN: '#006400' };

/** Pre-feature colors, mirroring LEGACY_ROUTE_COLORS for the routes used here */
const LEGACY = { mono: '#00AAFF', mixed: '#008000' };

const lookup = (source: string) =>
  ({ mono: SINGLE_COLOR, mixed: MULTI_COLOR })[source];

function section(overrides: Partial<Section> = {}): Section {
  return {
    id: 's1',
    name: 'Section 1',
    source: 'mixed',
    lane: 0,
    fromHold: 'F1',
    toHold: 'PAD',
    color: LEGACY.mixed,
    ...overrides,
  };
}

describe('isSectionColorCustomized', () => {
  it('should be false for an unmigrated section', () => {
    expect(isSectionColorCustomized(section())).toBe(false);
  });

  it('should be false when the override map is empty', () => {
    expect(isSectionColorCustomized(section({ colors: {} }))).toBe(false);
  });

  it('should be true once a tag is overridden', () => {
    expect(isSectionColorCustomized(section({ colors: { RED: '#123456' } }))).toBe(true);
  });
});

describe('resolveSectionColors', () => {
  it('should return the route colors when nothing is overridden', () => {
    expect(resolveSectionColors(section({ colors: {} }), MULTI_COLOR)).toEqual(MULTI_COLOR);
  });

  it('should apply overrides on top of the route colors', () => {
    const result = resolveSectionColors(section({ colors: { DARKGREEN: '#123456' } }), MULTI_COLOR);
    expect(result).toEqual({ RED: '#FF0000', DARKGREEN: '#123456' });
  });
});

describe('migrateSectionColors', () => {
  describe('sections saved before multi-color routes', () => {
    it('should adopt the route colors when the stored color was never customized', () => {
      const migrated = migrateSectionColors(section(), lookup, LEGACY);

      expect(migrated.colors).toEqual({});
      expect(migrated.color).toBe('#FF0000'); // mirror follows the new default tag
    });

    it('should ignore hex casing when detecting an untouched color', () => {
      // <input type="color"> always emits lowercase, so a user who re-picked the
      // identical color stores a different string for the same color
      const migrated = migrateSectionColors(
        section({ color: LEGACY.mixed.toLowerCase() }),
        lookup,
        LEGACY
      );

      expect(migrated.colors).toEqual({});
    });

    it('should pin a deliberately chosen color across every tag', () => {
      const migrated = migrateSectionColors(section({ color: '#FF6600' }), lookup, LEGACY);

      expect(migrated.colors).toEqual({ RED: '#FF6600', DARKGREEN: '#FF6600' });
      expect(migrated.color).toBe('#FF6600');
    });

    it('should keep a single-color route rendering identically', () => {
      const migrated = migrateSectionColors(
        section({ source: 'mono', color: LEGACY.mono }),
        lookup,
        LEGACY
      );

      expect(migrated.colors).toEqual({});
      expect(migrated.color).toBe(LEGACY.mono);
    });
  });

  describe('already migrated sections', () => {
    it('should leave existing overrides untouched', () => {
      const migrated = migrateSectionColors(
        section({ colors: { DARKGREEN: '#123456' } }),
        lookup,
        LEGACY
      );

      expect(migrated.colors).toEqual({ DARKGREEN: '#123456' });
    });

    it('should refresh a stale color mirror', () => {
      const migrated = migrateSectionColors(
        section({ color: '#000000', colors: { RED: '#123456' } }),
        lookup,
        LEGACY
      );

      expect(migrated.color).toBe('#123456');
    });

    it('should be idempotent', () => {
      const once = migrateSectionColors(section(), lookup, LEGACY);
      const twice = migrateSectionColors(once, lookup, LEGACY);

      expect(twice).toEqual(once);
    });

    it('should be idempotent for a customized section too', () => {
      const once = migrateSectionColors(section({ color: '#FF6600' }), lookup, LEGACY);
      const twice = migrateSectionColors(once, lookup, LEGACY);

      expect(twice).toEqual(once);
    });
  });

  describe('unknown source route', () => {
    it('should mark the section migrated and preserve its color', () => {
      const migrated = migrateSectionColors(section({ source: 'gone' }), lookup, LEGACY);

      expect(migrated.colors).toEqual({});
      expect(migrated.color).toBe(LEGACY.mixed);
    });
  });
});
