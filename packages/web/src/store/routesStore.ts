/**
 * Reference routes store
 * Loads reference routes from bundled JSON data
 */

import { create } from 'zustand';
import { type ReferenceRoute, type ReferenceRoutes, type RouteColorMap, getRouteColorMap, getDefaultColorTag } from '@voie-vitesse/core';
import type { HoldLabel } from './types';

// Import route data from single source of truth
import ifscData from '../../../../data/routes/ifsc.json';
import ifsc10mData from '../../../../data/routes/ifsc-10m.json';
import trainingData from '../../../../data/routes/training.json';
import u11u13Data from '../../../../data/routes/u11-u13.json';
import u12u14Data from '../../../../data/routes/u12-u14.json';
import u12u14CompData from '../../../../data/routes/u12-u14-comp.json';
import u11u13DeItData from '../../../../data/routes/u11-u13-de-it.json';
import u15Data from '../../../../data/routes/u15.json';
import u15ItData from '../../../../data/routes/u15-it.json';
import u13u15InData from '../../../../data/routes/u13-u15-in.json';
import u13DeData from '../../../../data/routes/u13-de.json';

/** Build reference routes from imported data */
function buildRoutes(): ReferenceRoutes {
  const routes: ReferenceRoutes = {};

  const routeDataList = [
    { name: 'ifsc', data: ifscData },
    { name: 'ifsc-10m', data: ifsc10mData },
    { name: 'training', data: trainingData },
    { name: 'u11-u13', data: u11u13Data },
    { name: 'u11-u13-comp', data: u11u13Data }, // Competition uses same route data
    { name: 'u12-u14', data: u12u14Data },
    { name: 'u12-u14-comp', data: u12u14CompData },
    { name: 'u11-u13-de-it', data: u11u13DeItData },
    { name: 'u15', data: u15Data },
    { name: 'u15-it', data: u15ItData },
    { name: 'u13-u15-in', data: u13u15InData },
    { name: 'u13-de', data: u13DeData },
  ];

  for (const { name, data } of routeDataList) {
    routes[name] = {
      color: data.color,
      holdScales: (data as { holdScales?: Record<string, number> }).holdScales,
      columns: (data as { columns?: string }).columns,
      holds: data.holds,
      smearingZones: (data as { smearingZones?: ReferenceRoute['smearingZones'] }).smearingZones,
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
  // Accept all possible column letters A-M (varies by coordinate system)
  const posMatch = positionStr.match(/^([A-M])(\d+(?:\.\d+)?)$/i);
  if (!posMatch) return undefined;

  return {
    side,
    column: posMatch[1].toUpperCase(),
    row: parseFloat(posMatch[2]),
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
  getHoldLabels: (name: string) => HoldLabel[];
  /** Get first hold label */
  getFirstHoldLabel: (name: string) => string | undefined;
  /** Get last hold label */
  getLastHoldLabel: (name: string) => string | undefined;
  /** Get position of the first hold */
  getFirstHoldPosition: (name: string) => HoldPosition | undefined;
  /** Get the route's default color (the first color it declares) */
  getRouteColor: (name: string) => string | undefined;
  /** Get the route's tag -> color map, normalized for single-color routes */
  getRouteColorMap: (name: string) => RouteColorMap | undefined;
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
      // Not end-anchored: a hold may carry a trailing #COLORTAG after its label
      const match = hold.match(/@([\w-]+)(?=\s|$)/);
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
    const colorMap = get().getRouteColorMap(name);
    if (!colorMap) return undefined;
    return colorMap[getDefaultColorTag({ color: colorMap })];
  },

  getRouteColorMap: (name: string) => {
    const route = get().routes[name.toLowerCase()];
    return route ? getRouteColorMap(route) : undefined;
  },
}));
