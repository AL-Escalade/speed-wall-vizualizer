/**
 * Route-related constants and business rules
 */

import {
  type Column,
  COLUMN_SYSTEMS as CORE_COLUMN_SYSTEMS,
  type ColumnSystem,
  type ColumnSystemId as CoreColumnSystemId,
  convertColumn as coreConvertColumn,
  VIRTUAL_COLUMNS,
  VIRTUAL_ROWS,
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

/** Route display names for UI (deprecated - use ROUTE_INTL_KEYS with intl instead) */
export const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  [ROUTE_SOURCES.TRAINING]: 'IFSC + U15 [FR]',
  [ROUTE_SOURCES.IFSC]: 'IFSC',
  [ROUTE_SOURCES.U11_U13]: 'U11/U13 [FR] (entraînement)',
  [ROUTE_SOURCES.U11_U13_COMP]: 'U11/U13 [FR] (compétition)',
  [ROUTE_SOURCES.U15]: 'U15 [FR]',
  [ROUTE_SOURCES.U15_IT]: 'U15 [IT/DE/CH]',
  [ROUTE_SOURCES.U13_DE]: 'U13 [DE/CH]',
};

/** Route intl message keys for i18n */
export const ROUTE_INTL_KEYS: Record<string, string> = {
  [ROUTE_SOURCES.TRAINING]: 'route.training',
  [ROUTE_SOURCES.IFSC]: 'route.ifsc',
  [ROUTE_SOURCES.U11_U13]: 'route.u11u13',
  [ROUTE_SOURCES.U11_U13_COMP]: 'route.u11u13comp',
  [ROUTE_SOURCES.U15]: 'route.u15',
  [ROUTE_SOURCES.U15_IT]: 'route.u15it',
  [ROUTE_SOURCES.U13_DE]: 'route.u13de',
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

/** Display names for coordinate systems (deprecated - use COORDINATE_SYSTEM_INTL_KEYS with intl instead) */
export const COORDINATE_SYSTEM_NAMES: Record<CoordinateSystemId, string> = {
  [COORDINATE_SYSTEMS.ABC]: 'ABC (A-K)',
  [COORDINATE_SYSTEMS.FFME]: 'FFME (A-L, sans J)',
  [COORDINATE_SYSTEMS.IFSC]: 'IFSC (A-M, sans J/K)',
};

/** Coordinate system intl message keys for i18n */
export const COORDINATE_SYSTEM_INTL_KEYS: Record<CoordinateSystemId, string> = {
  [COORDINATE_SYSTEMS.ABC]: 'coordinate.abc',
  [COORDINATE_SYSTEMS.FFME]: 'coordinate.ffme',
  [COORDINATE_SYSTEMS.IFSC]: 'coordinate.ifsc',
};

/** Default coordinate display system for the UI */
export const DEFAULT_COORDINATE_SYSTEM: CoordinateSystemId = COORDINATE_SYSTEMS.ABC;

/** Column labels on the climbing wall (default system) */
export const COLUMN_LABELS = COORDINATE_SYSTEM_COLUMNS[DEFAULT_COORDINATE_SYSTEM];

export type ColumnLabel = string;

/** Row numbers (1-10) */
export const ROW_COUNT = 10;

/** Extended row options for anchor positioning (0-11, where 0 and 11 are virtual) */
export const ANCHOR_ROW_OPTIONS = Array.from({ length: ROW_COUNT + 2 }, (_, i) => i);

/** Minimum anchor row (virtual row below first physical row) */
export const ANCHOR_ROW_MIN = VIRTUAL_ROWS.BELOW_FIRST;

/** Maximum anchor row (virtual row above last physical row) */
export const ANCHOR_ROW_MAX = VIRTUAL_ROWS.ABOVE_LAST;

/**
 * Get extended column identifiers for anchor positioning, including virtual positions,
 * in the internal storage coordinate system.
 *
 * Returns stored values:
 *   ['A-1', ...physicalColumns..., VIRTUAL_COLUMNS.AFTER_LAST ('K+1' in the internal ABC system)]
 *
 * Note: The AFTER_LAST entry is the fixed stored sentinel and is not adapted per coordinate system.
 * The `storageSystem` argument should refer to the storage/internal system
 * (e.g. INTERNAL_STORAGE_SYSTEM), not an arbitrary display system.
 */
export function getAnchorColumnOptions(storageSystem: CoordinateSystemId): string[] {
  const physical = [...COORDINATE_SYSTEM_COLUMNS[storageSystem]];
  return [VIRTUAL_COLUMNS.BEFORE_FIRST, ...physical, VIRTUAL_COLUMNS.AFTER_LAST];
}

/**
 * Get the display label for an anchor column, including virtual positions.
 * Virtual positions are shown in parentheses and adapt to the coordinate system.
 * - 'A-1' → '(A-1)' in all systems
 * - 'K+1' → '(K+1)' in ABC, '(L+1)' in FFME, '(M+1)' in IFSC
 * - Physical columns are displayed as-is
 */
export function getAnchorColumnDisplayLabel(storedColumn: string, system: CoordinateSystemId): string {
  if (storedColumn === VIRTUAL_COLUMNS.BEFORE_FIRST) return '(A-1)';
  if (storedColumn === VIRTUAL_COLUMNS.AFTER_LAST) {
    const columns = COORDINATE_SYSTEM_COLUMNS[system];
    const lastCol = columns[columns.length - 1];
    return `(${lastCol}+1)`;
  }
  return convertColumn(storedColumn, INTERNAL_STORAGE_SYSTEM, system);
}

/**
 * Get the display label for an anchor row.
 * Virtual rows (0, 11) are shown in parentheses.
 */
export function getAnchorRowDisplayLabel(row: number): string {
  if (row === VIRTUAL_ROWS.BELOW_FIRST || row === VIRTUAL_ROWS.ABOVE_LAST) return `(${row})`;
  return String(row);
}

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
  } catch (error) {
    console.warn(`Column conversion failed for "${column}" (${fromSystem} → ${toSystem}):`, error instanceof Error ? error.message : error);
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
