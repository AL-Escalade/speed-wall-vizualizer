import { describe, it, expect } from 'vitest';
import { useRoutesStore, type HoldPosition } from './routesStore';
// Aliased: the store exposes a same-named selector that these tests also use
import { getRouteColorMap as normalizeRouteColorMap, validateRouteColorTags } from '@voie-vitesse/core';
import { REFERENCE_ROUTES_BASE_URL } from '@/constants/routes';

// Known expected values from route data for specific assertions
const EXPECTED_ROUTE_NAMES = ['ifsc', 'ifsc-10m', 'training', 'u11-u13', 'u11-u13-comp', 'u12-u14', 'u12-u14-comp', 'u11-u13-de', 'u11-u13-it', 'u15', 'u15-de', 'u15-it', 'u13-u15-in', 'u13-de'] as const;
const IFSC_HOLD_COUNT = 32;
const U12_U14_HOLD_COUNT = 17;
const IFSC_COLOR = '#FF0000';
const IFSC_FIRST_LABEL = 'P1';
const IFSC_LAST_LABEL = 'PAD';
const IFSC_FIRST_HOLD_POSITION: HoldPosition = { side: 'DX', column: 'F', row: 4 };

/** Type assertion helper for narrowing undefined values */
function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  expect(value).toBeDefined();
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

describe('routesStore', () => {
  describe('routes', () => {
    it('should have all expected reference routes loaded', () => {
      const { routes } = useRoutesStore.getState();
      const routeNames = Object.keys(routes);

      expect(routeNames).toHaveLength(EXPECTED_ROUTE_NAMES.length);
      for (const name of EXPECTED_ROUTE_NAMES) {
        expect(routes[name]).toBeDefined();
      }
    });

    it('should have ifsc route with correct structure', () => {
      const { routes } = useRoutesStore.getState();
      expect(routes['ifsc'].color).toBe(IFSC_COLOR);
      expect(routes['ifsc'].holds).toHaveLength(IFSC_HOLD_COUNT);
    });

    it('should load both U12/U14 FFME setups', () => {
      const { routes } = useRoutesStore.getState();
      expect(routes['u12-u14'].holds).toHaveLength(U12_U14_HOLD_COUNT);
      expect(routes['u12-u14-comp'].holds).toHaveLength(U12_U14_HOLD_COUNT);
      expect(routes['u12-u14-comp'].holds).not.toEqual(routes['u12-u14'].holds);
    });
  });

  describe('getRoute', () => {
    it('should return a route by name', () => {
      const { getRoute } = useRoutesStore.getState();
      const route = getRoute('ifsc');

      assertDefined(route, 'ifsc route should exist');
      expect(route.color).toBe(IFSC_COLOR);
      expect(route.holds).toHaveLength(IFSC_HOLD_COUNT);
    });

    it('should be case insensitive', () => {
      const { getRoute } = useRoutesStore.getState();
      const lower = getRoute('ifsc');
      const upper = getRoute('IFSC');
      const mixed = getRoute('IfSc');

      expect(lower).toEqual(upper);
      expect(lower).toEqual(mixed);
    });

    it('should return undefined for unknown route', () => {
      const { getRoute } = useRoutesStore.getState();
      const route = getRoute('unknown-route');
      expect(route).toBeUndefined();
    });
  });

  describe('getRouteNames', () => {
    it('should return all expected route names', () => {
      const { getRouteNames } = useRoutesStore.getState();
      const names = getRouteNames();

      expect(names).toEqual([...EXPECTED_ROUTE_NAMES]);
    });
  });

  describe('getHoldCount', () => {
    it('should return correct hold count for ifsc route', () => {
      const { getHoldCount } = useRoutesStore.getState();
      expect(getHoldCount('ifsc')).toBe(IFSC_HOLD_COUNT);
    });

    it('should return 0 for unknown route', () => {
      const { getHoldCount } = useRoutesStore.getState();
      expect(getHoldCount('unknown-route')).toBe(0);
    });
  });

  describe('getHoldLabels', () => {
    it('should return correct labels for ifsc route', () => {
      const { getHoldLabels } = useRoutesStore.getState();
      const labels = getHoldLabels('ifsc');

      expect(labels).toHaveLength(IFSC_HOLD_COUNT);
      expect(labels[0]).toBe(IFSC_FIRST_LABEL);
      expect(labels[labels.length - 1]).toBe(IFSC_LAST_LABEL);
    });

    it('should return empty array for unknown route', () => {
      const { getHoldLabels } = useRoutesStore.getState();
      expect(getHoldLabels('unknown-route')).toEqual([]);
    });

    it('should extract labels without @ prefix', () => {
      const { getHoldLabels } = useRoutesStore.getState();
      const labels = getHoldLabels('ifsc');

      expect(labels.every(l => !l.startsWith('@'))).toBe(true);
    });
  });

  describe('getFirstHoldLabel', () => {
    it('should return first hold label for ifsc', () => {
      const { getFirstHoldLabel } = useRoutesStore.getState();
      expect(getFirstHoldLabel('ifsc')).toBe(IFSC_FIRST_LABEL);
    });

    it('should return undefined for unknown route', () => {
      const { getFirstHoldLabel } = useRoutesStore.getState();
      expect(getFirstHoldLabel('unknown-route')).toBeUndefined();
    });
  });

  describe('getLastHoldLabel', () => {
    it('should return last hold label for ifsc', () => {
      const { getLastHoldLabel } = useRoutesStore.getState();
      expect(getLastHoldLabel('ifsc')).toBe(IFSC_LAST_LABEL);
    });

    it('should return undefined for unknown route', () => {
      const { getLastHoldLabel } = useRoutesStore.getState();
      expect(getLastHoldLabel('unknown-route')).toBeUndefined();
    });
  });

  describe('getFirstHoldPosition', () => {
    it('should return correct position of first ifsc hold', () => {
      const { getFirstHoldPosition } = useRoutesStore.getState();
      const pos = getFirstHoldPosition('ifsc');

      expect(pos).toEqual(IFSC_FIRST_HOLD_POSITION);
    });

    it('should return undefined for unknown route', () => {
      const { getFirstHoldPosition } = useRoutesStore.getState();
      expect(getFirstHoldPosition('unknown-route')).toBeUndefined();
    });
  });

  describe('getRouteColor', () => {
    it('should return correct color for ifsc route', () => {
      const { getRouteColor } = useRoutesStore.getState();
      expect(getRouteColor('ifsc')).toBe(IFSC_COLOR);
    });

    it('should return the first declared color of a multi-color route', () => {
      const { getRouteColor } = useRoutesStore.getState();
      expect(getRouteColor('u15-it')).toBe('#FF0000');
    });

    it('should return undefined for unknown route', () => {
      const { getRouteColor } = useRoutesStore.getState();
      expect(getRouteColor('unknown-route')).toBeUndefined();
    });
  });

  describe('getRouteColorMap', () => {
    it('should normalize a single-color route under the default tag', () => {
      const { getRouteColorMap } = useRoutesStore.getState();
      expect(getRouteColorMap('ifsc')).toEqual({ DEFAULT: IFSC_COLOR });
    });

    it('should preserve declaration order for a multi-color route', () => {
      const { getRouteColorMap } = useRoutesStore.getState();
      const colorMap = getRouteColorMap('u15-it');

      assertDefined(colorMap, 'u15-it color map should exist');
      expect(Object.keys(colorMap)).toEqual(['RED', 'DARKGREEN']);
      expect(colorMap).toEqual({ RED: '#FF0000', DARKGREEN: '#006400' });
    });

    it('should return undefined for unknown route', () => {
      const { getRouteColorMap } = useRoutesStore.getState();
      expect(getRouteColorMap('unknown-route')).toBeUndefined();
    });
  });

  describe('getRouteReferenceUrl', () => {
    it('should build the URL of the bundled official plan', () => {
      const { getRouteReferenceUrl } = useRoutesStore.getState();
      expect(getRouteReferenceUrl('u15-de'))
        .toBe(`${REFERENCE_ROUTES_BASE_URL}/germany-u15-speed-route-2025.pdf`);
    });

    it('should return undefined for a route with no published plan', () => {
      const { getRouteReferenceUrl } = useRoutesStore.getState();
      expect(getRouteReferenceUrl('training')).toBeUndefined();
    });

    it('should return undefined for unknown route', () => {
      const { getRouteReferenceUrl } = useRoutesStore.getState();
      expect(getRouteReferenceUrl('unknown-route')).toBeUndefined();
    });
  });

  describe('route data integrity', () => {
    it.each(EXPECTED_ROUTE_NAMES)('should declare valid colors and tags for %s', (name) => {
      const { getRoute } = useRoutesStore.getState();
      const route = getRoute(name);

      assertDefined(route, `${name} route should exist`);
      const colorMap = normalizeRouteColorMap(route);

      expect(Object.keys(colorMap).length).toBeGreaterThan(0);
      for (const color of Object.values(colorMap)) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
      // Tags fall back silently at render time, so this is the only real guard
      expect(validateRouteColorTags(route)).toEqual([]);
    });

    // Regression guard: an end-anchored @LABEL regex would silently drop every
    // hold carrying a trailing #COLORTAG, breaking the from/to dropdowns and the
    // default toHold of new sections. Covers EVERY route, so a newly tagged one
    // is protected without anyone remembering to extend this list.
    it.each(EXPECTED_ROUTE_NAMES)('should keep every tagged hold of %s in the label list', (name) => {
      const { getHoldLabels, getLastHoldLabel, getRoute } = useRoutesStore.getState();
      const route = getRoute(name);

      assertDefined(route, `${name} route should exist`);
      // Length equality is the real guard: dropping a tagged hold shortens the list
      expect(getHoldLabels(name)).toHaveLength(route.holds.length);
      // Every route ends on its finish pad (u15 names it PAD-U15)
      expect(getLastHoldLabel(name)).toMatch(/^PAD/);
    });

    it('should cover at least one tagged route, so the guard above is meaningful', () => {
      const { getRoute } = useRoutesStore.getState();
      const tagged = EXPECTED_ROUTE_NAMES.filter((name) =>
        getRoute(name)?.holds.some((h) => h.includes(' #'))
      );

      expect(tagged.length).toBeGreaterThanOrEqual(6);
    });
  });
});
