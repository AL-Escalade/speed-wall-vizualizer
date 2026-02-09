/**
 * Route-related constants and business rules
 */

import {
  type Column,
  COLUMN_SYSTEMS as CORE_COLUMN_SYSTEMS,
  type ColumnSystem,
  type ColumnSystemId as CoreColumnSystemId,
  convertColumn as coreConvertColumn,
} from '@voie-vitesse/core';

/** Panel sides */
export const PANEL_SIDES = {
  LEFT: 'SN',
  RIGHT: 'DX',
} as const;

export type PanelSide = typeof PANEL_SIDES[keyof typeof PANEL_SIDES];

/** Route source identifiers */
export const ROUTE_SOURCES = {
  TRAINING: 'training',
  IFSC: 'ifsc',
  U11_U13: 'u11-u13',
  U11_U13_COMP: 'u11-u13-comp',
  U15: 'u15',
  U15_IT: 'u15-it',
  U13_DE: 'u13-de',
} as const;

export type RouteSource = typeof ROUTE_SOURCES[keyof typeof ROUTE_SOURCES];

/** Route display names for UI */
export const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  [ROUTE_SOURCES.TRAINING]: 'IFSC + U15 [FR]',
  [ROUTE_SOURCES.IFSC]: 'IFSC',
  [ROUTE_SOURCES.U11_U13]: 'U11/U13 [FR] (entraînement)',
  [ROUTE_SOURCES.U11_U13_COMP]: 'U11/U13 [FR] (compétition)',
  [ROUTE_SOURCES.U15]: 'U15 [FR]',
  [ROUTE_SOURCES.U15_IT]: 'U15 [IT/DE/CH]',
  [ROUTE_SOURCES.U13_DE]: 'U13 [DE/CH]',
};

/**
 * Coordinate display system identifiers
 * - ABC: ABCDEFGHIJK (11 columns, no L) - simple/default system, also used for internal storage
 * - FFME: ABCDEFGHIKL (11 columns, no J) - French federation
 * - IFSC: ABCDEFGHILM (11 columns, no J/K) - International federation
 */
export const COORDINATE_SYSTEMS = {
  ABC: 'ABC',
  FFME: 'FFME',
  IFSC: 'IFSC',
} as const;

export type CoordinateSystemId = typeof COORDINATE_SYSTEMS[keyof typeof COORDINATE_SYSTEMS];

/**
 * Internal storage system for coordinates.
 * All coordinates are stored in ABC system internally and converted for display.
 * This is the canonical representation used throughout the application.
 */
export const INTERNAL_STORAGE_SYSTEM: CoordinateSystemId = COORDINATE_SYSTEMS.ABC;

/** Column letters for each coordinate system (derived from core) */
export const COORDINATE_SYSTEM_COLUMNS: Record<CoordinateSystemId, readonly string[]> = {
  [COORDINATE_SYSTEMS.ABC]: CORE_COLUMN_SYSTEMS.ABC.split(''),
  [COORDINATE_SYSTEMS.FFME]: CORE_COLUMN_SYSTEMS.FFME.split(''),
  [COORDINATE_SYSTEMS.IFSC]: CORE_COLUMN_SYSTEMS.IFSC.split(''),
} as const;

/** Display names for coordinate systems */
export const COORDINATE_SYSTEM_NAMES: Record<CoordinateSystemId, string> = {
  [COORDINATE_SYSTEMS.ABC]: 'ABC (A-K)',
  [COORDINATE_SYSTEMS.FFME]: 'FFME (A-L, sans J)',
  [COORDINATE_SYSTEMS.IFSC]: 'IFSC (A-M, sans J/K)',
};

/** Default coordinate display system for the UI */
export const DEFAULT_COORDINATE_SYSTEM: CoordinateSystemId = COORDINATE_SYSTEMS.ABC;

/** Column labels on the climbing wall (default system) */
export const COLUMN_LABELS = COORDINATE_SYSTEM_COLUMNS[DEFAULT_COORDINATE_SYSTEM];

export type ColumnLabel = string;

/** Row numbers (1-10) */
export const ROW_COUNT = 10;

/** Default anchor position */
export const DEFAULT_ANCHOR = {
  side: PANEL_SIDES.LEFT as PanelSide,
  column: 'A' as ColumnLabel,
  row: 1,
};

/** Competition routes use a specific anchor position */
export const COMPETITION_ANCHOR = {
  side: PANEL_SIDES.RIGHT as PanelSide,
  column: 'A' as ColumnLabel,
  row: 3,
};

/** Check if a route source uses competition anchor */
export function isCompetitionRoute(source: string): boolean {
  return source === ROUTE_SOURCES.U11_U13_COMP;
}

/** Default hold labels when none available */
export const DEFAULT_HOLDS = {
  FIRST: 'P1',
  LAST: 'PAD',
};

/** Default section color */
export const DEFAULT_SECTION_COLOR = '#FF0000';

/**
 * Map CoordinateSystemId to core ColumnSystem string
 */
function toColumnSystem(systemId: CoordinateSystemId): ColumnSystem {
  return CORE_COLUMN_SYSTEMS[systemId as CoreColumnSystemId];
}

/**
 * Convert a column from one coordinate system to another.
 * Safe wrapper around core's convertColumn that won't throw on invalid columns.
 * @param column - Column letter in the source system
 * @param fromSystem - Source coordinate system ID
 * @param toSystem - Target coordinate system ID
 * @returns Column letter in the target system, or original column if conversion fails
 */
export function convertColumn(
  column: string,
  fromSystem: CoordinateSystemId,
  toSystem: CoordinateSystemId
): string {
  if (fromSystem === toSystem) return column;

  try {
    return coreConvertColumn(column as Column, toColumnSystem(fromSystem), toColumnSystem(toSystem));
  } catch {
    // Column not found in source system, return as-is (graceful degradation for UI)
    return column;
  }
}

/**
 * Get column labels for a specific coordinate system
 * @param system - Coordinate system ID
 * @returns Array of column labels
 */
export function getColumnLabelsForSystem(system: CoordinateSystemId): readonly string[] {
  return COORDINATE_SYSTEM_COLUMNS[system];
}
