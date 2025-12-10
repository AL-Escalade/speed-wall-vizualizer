/**
 * Core library for speed climbing wall visualization
 */

// Types
export type {
  PanelSide,
  PanelNumber,
  Column,
  Row,
  PanelId,
  InsertPosition,
  Insert,
  Point,
  Dimensions,
  HoldTypeDimensions,
  Hold,
  HoldScales,
  ReferenceRoute,
  ReferenceRoutes,
  AnchorPosition,
  RouteSegment,
  GeneratedRoute,
  WallConfig,
  Config,
  ArrowDirection,
  LabelZone,
  LabelZones,
  HoldSvgData,
  OutputFormat,
  HoldTypeConfig,
  HoldTypesConfig,
  ColumnSystemId,
  ColumnSystem,
} from './types.js';

// Column coordinate systems
export { COLUMN_SYSTEMS, DEFAULT_COLUMN_SYSTEM, CANONICAL_COLUMN_SYSTEM } from './types.js';

// SVG Generation
export { generateSvg } from './svg-generator.js';
export type { SvgOptions } from './svg-generator.js';

// Route Composition
export { composeAllRoutes, composeRoute, extractHolds, parseHold, getRouteHolds } from './route-composer.js';
export type { ComposedHold } from './route-composer.js';

// Hold SVG Parsing
export {
  parseHoldSvg,
  loadHoldSvg,
  clearSvgCache,
  loadHoldTypesConfig,
  getHoldTypeConfig,
  getHoldDefaultOrientation,
  getHoldDimensions,
  getHoldLabelMargin,
  getHoldShowArrow,
  clearHoldTypesConfigCache,
} from './hold-svg-parser.js';

// Grid utilities
export {
  GRID,
  PANEL,
  ROWS,
  COLUMNS,
  PANEL_NUMBERS,
  PANELS_PER_LANE,
  getWallDimensions,
  getInsertPosition,
  parsePanelId,
  parseInsertPosition,
  getColumnIndex,
  getColumnLetter,
  convertColumn,
  getColumnsForSystem,
  validateColumn,
} from './plate-grid.js';

// Rotation utilities
export { calculateAngle, calculateHoldRotation, calculateRotation } from './rotation.js';

// Bundled assets (for browser compatibility)
export { HOLD_SVG_CONTENT, HOLD_TYPES_CONFIG, getAvailableHoldTypes } from './bundled-assets.js';
