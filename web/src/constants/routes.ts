/**
 * Route-related constants and business rules
 */

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
} as const;

export type RouteSource = typeof ROUTE_SOURCES[keyof typeof ROUTE_SOURCES];

/** Route display names for UI */
export const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  [ROUTE_SOURCES.TRAINING]: 'Combinaison voie U15 et IFSC',
  [ROUTE_SOURCES.IFSC]: 'IFSC',
  [ROUTE_SOURCES.U11_U13]: 'U11/U13 (entraînement)',
  [ROUTE_SOURCES.U11_U13_COMP]: 'U11/U13 (compétition)',
  [ROUTE_SOURCES.U15]: 'U15',
};

/** Column labels on the climbing wall */
export const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L'] as const;

export type ColumnLabel = typeof COLUMN_LABELS[number];

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
