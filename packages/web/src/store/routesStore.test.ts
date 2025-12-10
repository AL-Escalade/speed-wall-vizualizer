import { describe, it, expect } from 'vitest';
import { useRoutesStore } from './routesStore';
import type { HoldPosition } from './routesStore';

// Known expected values from route data for specific assertions
const EXPECTED_ROUTE_NAMES = ['ifsc', 'training', 'u11-u13', 'u11-u13-comp', 'u15'] as const;
const IFSC_HOLD_COUNT = 32;
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

    it('should return undefined for unknown route', () => {
      const { getRouteColor } = useRoutesStore.getState();
      expect(getRouteColor('unknown-route')).toBeUndefined();
    });
  });
});
