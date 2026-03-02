/**
 * Types for speed climbing wall visualization
 */

/** Panel side identifier: SN (sinistra/left) or DX (destra/right) */
export type PanelSide = 'SN' | 'DX';

/** Panel number (1-10, 1 = bottom) */
export type PanelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Column letter - any letter used in coordinate systems (A-M, varies by system) */
export type Column = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M';

/** Virtual column positions for anchors (not physical inserts) */
export const VIRTUAL_COLUMNS = { BEFORE_FIRST: 'A-1', AFTER_LAST: 'K+1' } as const;
export type VirtualColumn = typeof VIRTUAL_COLUMNS[keyof typeof VIRTUAL_COLUMNS];
/** Column type extended with virtual positions, for use in anchor positions only */
export type AnchorColumn = Column | VirtualColumn;

/**
 * Column coordinate system identifier
 * - ABC: ABCDEFGHIJK (11 columns, no L) - default/simple system
 * - FFME: ABCDEFGHIKL (11 columns, no J) - French federation
 * - IFSC: ABCDEFGHILM (11 columns, no J/K) - International federation
 */
export type ColumnSystemId = 'ABC' | 'FFME' | 'IFSC';

/** Column system definition - string of 11 column letters in order */
export type ColumnSystem = string;

/** Predefined column systems */
export const COLUMN_SYSTEMS: Record<ColumnSystemId, ColumnSystem> = {
  ABC: 'ABCDEFGHIJK',
  FFME: 'ABCDEFGHIKL',
  IFSC: 'ABCDEFGHILM',
} as const;

/** Internal canonical column system (used for all position calculations) */
export const CANONICAL_COLUMN_SYSTEM: ColumnSystem = COLUMN_SYSTEMS.ABC;

/** Default column system for parsing routes without explicit columns field (FFME for backwards compatibility) */
export const DEFAULT_COLUMN_SYSTEM: ColumnSystem = COLUMN_SYSTEMS.FFME;

/** Row number within a panel (1-10, 1 = bottom) */
export type Row = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Virtual row positions for anchors (not physical inserts) */
export const VIRTUAL_ROWS = { BELOW_FIRST: 0, ABOVE_LAST: 11 } as const;
export type VirtualRow = typeof VIRTUAL_ROWS[keyof typeof VIRTUAL_ROWS];
/** Row type extended with virtual positions, for use in anchor positions only */
export type AnchorRow = Row | VirtualRow;

/** Panel identifier (e.g., "SN1", "DX5") */
export interface PanelId {
  side: PanelSide;
  number: PanelNumber;
}

/** Insert position within a panel */
export interface InsertPosition {
  column: Column;
  row: Row;
}

/** Full insert coordinates */
export interface Insert {
  panel: PanelId;
  position: InsertPosition;
}

/** Absolute position in mm */
export interface Point {
  x: number;
  y: number;
}

/** Dimensions in mm */
export interface Dimensions {
  width: number;
  height: number;
}

/** Hold type dimensions per reference route */
export type HoldTypeDimensions = Record<string, Dimensions>;

/** A single hold definition */
export interface Hold {
  panel: PanelId;
  type: string;  // "BIG", "FOOT", or custom type
  position: InsertPosition;
  orientation: InsertPosition;
  /** Panel for orientation target (defaults to same as position panel) */
  orientationPanel?: PanelId;
  /** Scale factor for this hold (1.0 = full size). Default: 1.0 */
  scale?: number;
  /** Label for this hold (e.g., "M1", "P2") */
  label?: string;
}

/** Scale factors per hold type */
export type HoldScales = Record<string, number>;

/** Smearing zone definition in reference route */
export interface SmearingZone {
  /** Zone identifier displayed on the plan (e.g., "Z1", "Zone A") */
  label: string;
  /** Panel identifier where the zone starts (e.g., "DX1", "SN3") */
  panel: string;
  /** Column letter for the bottom-left corner (A-L) */
  column: Column;
  /** Horizontal offset from the column in insert units (e.g., 0.5 = half column to the right) */
  columnOffset?: number;
  /** Row number for the bottom-left corner (can be decimal, e.g., 4.5 = between rows 4 and 5) */
  row: number;
  /** Width in insert units (float, e.g., 2.5 = 2.5 column spacings) */
  width: number;
  /** Height in insert units (float, e.g., 4.0 = 4 row spacings, can span panels) */
  height: number;
}

/** Composed smearing zone with computed offsets */
export interface ComposedSmearingZone extends SmearingZone {
  /** Color inherited from reference route or segment override */
  color: string;
  /** Anchor offset applied from segment (in mm) */
  anchorOffset?: Point;
  /** Horizontal lane offset from segment */
  laneOffset: number;
}

/** Reference route definition */
export interface ReferenceRoute {
  /** Color for holds from this route */
  color: string;
  /** Scale factors per hold type (e.g., { "BIG": 0.8, "FOOT": 0.8 }) */
  holdScales?: HoldScales;
  /** Column coordinate system used in hold definitions (default: ABC = "ABCDEFGHIJK") */
  columns?: ColumnSystem;
  /** List of holds in compact format: "PANEL TYPE POSITION ORIENTATION [SCALE]" */
  holds: string[];
  /** Smearing zones (areas for friction-based foot placements) */
  smearingZones?: SmearingZone[];
}

/** All reference routes */
export type ReferenceRoutes = Record<string, ReferenceRoute>;

/** Anchor position for placing a route segment */
export interface AnchorPosition {
  /** Panel (e.g., "DX1", "SN3") */
  panel: string;
  /** Column (any core Column for the active system, or virtual: A-1, K+1) */
  column: AnchorColumn;
  /** Row (1-10, or virtual: 0, 11) */
  row: AnchorRow;
}

/** A segment of a route taken from a reference route */
export interface RouteSegment {
  /** Source reference route name (e.g., "ifsc", "u11-u13") */
  source: string;
  /** First hold: number (1-based) or label. Default: 1 */
  fromHold?: number | string;
  /** Last hold: number (1-based) or label. Default: last hold */
  toHold?: number | string;
  /** Holds to exclude: can be numbers (1-based) or labels (e.g., "M1", "P2") */
  excludeHolds?: (number | string)[];
  /** Where to place the first hold. If specified, all holds are offset accordingly */
  anchor?: AnchorPosition;
  /** Override color for this segment (default: use route color) */
  color?: string;
  /** Horizontal offset in lanes (0 = leftmost lane). Default: 0 */
  laneOffset?: number;
}

/** A generated route */
export interface GeneratedRoute {
  /** Segments composing the route */
  segments: RouteSegment[];
}

/** Wall configuration */
export interface WallConfig {
  /** Number of lanes (default: 2) */
  lanes: number;
  /** Number of panels in height (default: 10) */
  panelsHeight: number;
}

/** Full configuration */
export interface Config {
  wall: WallConfig;
  routes: GeneratedRoute[];
}

/** Arrow direction for label zone selection */
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/** Label zone definition from SVG */
export interface LabelZone {
  /** The cleaned text element to include in the transformed group */
  element: string;
}

/** Label zones indexed by arrow direction */
export type LabelZones = Partial<Record<ArrowDirection | 'default', LabelZone>>;

/** Parsed hold SVG data */
export interface HoldSvgData {
  /** The path element content for the hold shape (null if no colored shape) */
  pathElement: string | null;
  /** Additional elements (circles for insert, screw holes, etc.) */
  additionalElements: string[];
  /** Center of the insert circle (anchor point), with transforms applied */
  insertCenter: Point;
  /** Original viewBox dimensions */
  viewBox: Dimensions;
  /** Rotation angle (in degrees) from the SVG's transform, if any */
  svgRotation: number;
  /** Label zones for different orientations */
  labelZones: LabelZones;
}

/** Output format */
export type OutputFormat = 'svg' | 'pdf' | 'png';

/** Hold type configuration */
export interface HoldTypeConfig {
  /** Description of the hold type */
  description?: string;
  /** Physical dimensions in mm */
  dimensions: Dimensions;
  /** Default orientation angle in degrees (0° = right, 90° = up, counterclockwise) */
  defaultOrientation: number;
  /** Additional margin for label positioning in mm (default: 0) */
  labelMargin?: number;
  /** Whether to show arrow indicator for this hold type (default: true) */
  showArrow?: boolean;
}

/** All hold type configurations */
export type HoldTypesConfig = Record<string, HoldTypeConfig>;
