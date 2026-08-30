/**
 * Core library for speed climbing wall visualization
 */

// Types
export type {
  PanelSide,
  PanelNumber,
  Column,
  VirtualColumn,
  AnchorColumn,
  Row,
  VirtualRow,
  AnchorRow,
  PanelId,
  InsertPosition,
  Insert,
  Point,
  Dimensions,
  HoldTypeDimensions,
  Hold,
  HoldScales,
  SmearingZone,
  ComposedSmearingZone,
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
  RouteColorMap,
} from './types.js';

// Column coordinate systems
export { COLUMN_SYSTEMS, DEFAULT_COLUMN_SYSTEM, CANONICAL_COLUMN_SYSTEM, VIRTUAL_COLUMNS, VIRTUAL_ROWS } from './types.js';

// Hold colors
export { DEFAULT_COLOR_TAG } from './types.js';

// Hold labels
export { parseHoldLabel, formatHoldLabel, DEFAULT_HOLD_LABEL_LANGUAGE } from './hold-label.js';
export type { HoldRole, HoldLabelLanguage } from './hold-label.js';

// Smearing zone labels (a namespace of their own: R is a hold role and a zone prefix)
export { parseSmearingZoneLabel, formatSmearingZoneLabel } from './smearing-zone-label.js';
export type { SmearingZoneRole } from './smearing-zone-label.js';

// SVG Generation
export { generateSvg } from './svg-generator.js';
export type { SvgOptions } from './svg-generator.js';

// Route Composition
export { composeAllRoutes, composeRoute, extractHolds, parseHold, getRouteHolds, composeAllSmearingZones, composeSmearingZones, extractSmearingZones, getRouteColorMap, getDefaultColorTag, validateRouteColorTags } from './route-composer.js';
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
  getAnchorColumnIndex,
  getAnchorMmPosition,
} from './plate-grid.js';

// Rotation utilities
export { calculateAngle, calculateHoldRotation, calculateRotation } from './rotation.js';

// Bundled assets (for browser compatibility)
export { HOLD_SVG_CONTENT, HOLD_TYPES_CONFIG, getAvailableHoldTypes } from './bundled-assets.js';
