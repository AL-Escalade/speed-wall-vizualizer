import { describe, it, expect } from 'vitest';
import { getRouteColorMap, DEFAULT_COLOR_TAG } from '@voie-vitesse/core';
import { LEGACY_ROUTE_COLORS } from './legacyRouteColors';
import { useRoutesStore } from '@/store/routesStore';

/**
 * migrateSectionColors() reads this table to tell an inherited color from a
 * deliberate one. A missing or wrong entry silently misclassifies a saved
 * section, so guard the table against drift here rather than trusting it.
 */
describe('LEGACY_ROUTE_COLORS', () => {
  const routeNames = useRoutesStore.getState().getRouteNames();

  it('should cover every registered route', () => {
    const missing = routeNames.filter((name) => LEGACY_ROUTE_COLORS[name] === undefined);
    expect(missing).toEqual([]);
  });

  it('should not list routes that no longer exist', () => {
    const stale = Object.keys(LEGACY_ROUTE_COLORS).filter((name) => !routeNames.includes(name));
    expect(stale).toEqual([]);
  });

  it.each(
    // A route still declaring one color never had a different color before, so
    // its frozen entry must match. Multi-color routes are exempt: their legacy
    // value is historical and cannot be derived from the data any more.
    useRoutesStore
      .getState()
      .getRouteNames()
      .filter((name) => typeof useRoutesStore.getState().getRoute(name)?.color === 'string')
  )('should match the current color of the still-single-color route %s', (name) => {
    const route = useRoutesStore.getState().getRoute(name);
    expect(route).toBeDefined();
    const colorMap = getRouteColorMap(route!);

    expect(LEGACY_ROUTE_COLORS[name].toLowerCase()).toBe(colorMap[DEFAULT_COLOR_TAG].toLowerCase());
  });

  it('should use lowercase-insensitive valid hex colors', () => {
    for (const color of Object.values(LEGACY_ROUTE_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
