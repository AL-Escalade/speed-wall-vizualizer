/**
 * Reference routes store
 * Loads reference routes from bundled JSON data
 */

import { create } from 'zustand';
import type { ReferenceRoute, ReferenceRoutes } from '@voie-vitesse/core';

// Import route data from single source of truth
import ifscData from '../../../data/routes/ifsc.json';
import trainingData from '../../../data/routes/training.json';
import u11u13Data from '../../../data/routes/u11-u13.json';
import u15Data from '../../../data/routes/u15.json';

/** Build reference routes from imported data */
function buildRoutes(): ReferenceRoutes {
  const routes: ReferenceRoutes = {};

  const routeDataList = [
    { name: 'ifsc', data: ifscData },
    { name: 'training', data: trainingData },
    { name: 'u11-u13', data: u11u13Data },
    { name: 'u11-u13-comp', data: u11u13Data }, // Competition uses same route data
    { name: 'u15', data: u15Data },
  ];

  for (const { name, data } of routeDataList) {
    routes[name] = {
      color: data.color,
      holdScales: (data as { holdScales?: Record<string, number> }).holdScales,
      holds: data.holds,
    };
  }

  return routes;
}

const REFERENCE_ROUTES = buildRoutes();

/** Position of a hold */
export interface HoldPosition {
  side: 'SN' | 'DX';
  column: string;
  row: number;
}

/**
 * Parse a hold string to extract its position
 * Format: "PANEL TYPE POSITION ORIENTATION [@LABEL]"
 * Example: "SN1 FOOT G3 I3 @P1" -> { side: 'SN', column: 'G', row: 3 }
 */
function parseHoldPosition(holdStr: string): HoldPosition | undefined {
  const parts = holdStr.trim().split(/\s+/);
  if (parts.length < 4) return undefined;

  const [panelStr, , positionStr] = parts;

  // Parse panel (e.g., "SN1" -> side: "SN")
  const panelMatch = panelStr.match(/^(SN|DX)\d+$/i);
  if (!panelMatch) return undefined;
  const side = panelMatch[1].toUpperCase() as 'SN' | 'DX';

  // Parse position (e.g., "G3" -> column: "G", row: 3)
  const posMatch = positionStr.match(/^([A-L])(\d+)$/i);
  if (!posMatch) return undefined;

  return {
    side,
    column: posMatch[1].toUpperCase(),
    row: parseInt(posMatch[2], 10),
  };
}

interface RoutesState {
  /** Available reference routes */
  routes: ReferenceRoutes;
  /** Get a specific route by name */
  getRoute: (name: string) => ReferenceRoute | undefined;
  /** Get all route names */
  getRouteNames: () => string[];
  /** Get hold count for a route */
  getHoldCount: (name: string) => number;
  /** Get hold labels for a route */
  getHoldLabels: (name: string) => string[];
  /** Get first hold label */
  getFirstHoldLabel: (name: string) => string | undefined;
  /** Get last hold label */
  getLastHoldLabel: (name: string) => string | undefined;
  /** Get position of the first hold */
  getFirstHoldPosition: (name: string) => HoldPosition | undefined;
  /** Get the route's default color */
  getRouteColor: (name: string) => string | undefined;
}

export const useRoutesStore = create<RoutesState>()((_set, get) => ({
  routes: REFERENCE_ROUTES,

  getRoute: (name: string) => {
    return get().routes[name.toLowerCase()];
  },

  getRouteNames: () => {
    return Object.keys(get().routes);
  },

  getHoldCount: (name: string) => {
    const route = get().routes[name.toLowerCase()];
    return route?.holds.length ?? 0;
  },

  getHoldLabels: (name: string) => {
    const route = get().routes[name.toLowerCase()];
    if (!route) return [];
    return route.holds.map((hold) => {
      const match = hold.match(/@([\w-]+)$/);
      return match ? match[1] : '';
    }).filter(Boolean);
  },

  getFirstHoldLabel: (name: string) => {
    const labels = get().getHoldLabels(name);
    return labels[0];
  },

  getLastHoldLabel: (name: string) => {
    const labels = get().getHoldLabels(name);
    return labels[labels.length - 1];
  },

  getFirstHoldPosition: (name: string) => {
    const route = get().routes[name.toLowerCase()];
    if (!route || route.holds.length === 0) return undefined;
    return parseHoldPosition(route.holds[0]);
  },

  getRouteColor: (name: string) => {
    const route = get().routes[name.toLowerCase()];
    return route?.color;
  },
}));
