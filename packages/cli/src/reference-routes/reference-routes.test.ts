import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseHold,
  getRouteHolds,
  loadRoutes,
  clearRoutesCache,
  getReferenceRoute,
  getAvailableRouteNames,
} from './index.js';
import { COLUMN_SYSTEMS } from '@voie-vitesse/core';
import type { ReferenceRoute } from '@voie-vitesse/core';

// Note: parseHold is tested extensively in @voie-vitesse/core (route-composer.test.ts)
// These tests focus on CLI-specific behavior differences
describe('parseHold (CLI-specific behavior)', () => {
  it('should use ABC column system as default', () => {
    // CLI defaults to ABC, while core defaults to FFME
    // In ABC system, column K is valid (index 10)
    const hold = parseHold('SN1 BIG K1 K2');
    expect(hold.position.column).toBe('K');
    expect(hold.orientation.column).toBe('K');
  });

  it('should throw for invalid panel ID', () => {
    expect(() => parseHold('XX1 BIG A1 B2', COLUMN_SYSTEMS.ABC)).toThrow('Invalid panel ID');
  });

  it('should throw for invalid position format', () => {
    expect(() => parseHold('SN1 BIG 1A B2', COLUMN_SYSTEMS.ABC)).toThrow('Invalid position');
  });

  it('should validate columns against the specified column system', () => {
    // Column L is invalid in ABC system (only A-K)
    expect(() => parseHold('SN1 BIG L1 A2', COLUMN_SYSTEMS.ABC)).toThrow();
  });
});

describe('getRouteHolds', () => {
  it('should parse all holds from a route', () => {
    const route: ReferenceRoute = {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4'],
    };

    const holds = getRouteHolds(route);
    expect(holds).toHaveLength(2);
    expect(holds[0].type).toBe('BIG');
    expect(holds[1].type).toBe('FOOT');
  });

  it('should use ABC system as default when no columns specified', () => {
    const route: ReferenceRoute = {
      color: '#FF0000',
      holds: ['SN1 BIG A1 B2'],
    };

    // Should not throw - ABC is the default for CLI parseHold
    const holds = getRouteHolds(route);
    expect(holds).toHaveLength(1);
  });
});

describe('loadRoutes', () => {
  beforeEach(() => {
    clearRoutesCache();
  });

  it('should load routes from data directory', () => {
    const routes = loadRoutes();
    // Should load some routes from the data/routes directory
    const routeNames = Object.keys(routes);
    expect(routeNames.length).toBeGreaterThan(0);
  });

  it('should cache loaded routes', () => {
    const first = loadRoutes();
    const second = loadRoutes();
    expect(first).toBe(second);
  });

  it('should return empty object for non-existent directory', () => {
    const routes = loadRoutes('/non/existent/directory');
    expect(routes).toEqual({});
  });
});

describe('getReferenceRoute', () => {
  beforeEach(() => {
    clearRoutesCache();
  });

  it('should return a reference route by name', () => {
    const routes = loadRoutes();
    const routeNames = Object.keys(routes);

    if (routeNames.length > 0) {
      const route = getReferenceRoute(routeNames[0]);
      expect(route).toBeDefined();
      expect(route!.color).toBeDefined();
      expect(route!.holds).toBeDefined();
    }
  });

  it('should be case insensitive', () => {
    const routes = loadRoutes();
    const routeNames = Object.keys(routes);

    if (routeNames.length > 0) {
      const lower = getReferenceRoute(routeNames[0].toLowerCase());
      const upper = getReferenceRoute(routeNames[0].toUpperCase());
      expect(lower).toEqual(upper);
    }
  });

  it('should return undefined for unknown route', () => {
    const route = getReferenceRoute('non-existent-route-xyz');
    expect(route).toBeUndefined();
  });
});

describe('getAvailableRouteNames', () => {
  beforeEach(() => {
    clearRoutesCache();
  });

  it('should return array of route names', () => {
    const names = getAvailableRouteNames();
    expect(Array.isArray(names)).toBe(true);
  });

  it('should return names matching loadRoutes keys', () => {
    const routes = loadRoutes();
    const names = getAvailableRouteNames();
    expect(names).toEqual(Object.keys(routes));
  });
});

describe('clearRoutesCache', () => {
  it('should clear the cache so routes are reloaded', () => {
    const first = loadRoutes();
    clearRoutesCache();
    const second = loadRoutes();
    // Both should be valid but may be different objects
    expect(Object.keys(first).length).toBe(Object.keys(second).length);
  });
});
