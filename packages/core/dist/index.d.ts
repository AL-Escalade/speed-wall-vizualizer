/**
 * Core library for speed climbing wall visualization
 */
export type { PanelSide, PanelNumber, Column, Row, PanelId, InsertPosition, Insert, Point, Dimensions, HoldTypeDimensions, Hold, HoldScales, ReferenceRoute, ReferenceRoutes, AnchorPosition, RouteSegment, GeneratedRoute, WallConfig, Config, ArrowDirection, LabelZone, LabelZones, HoldSvgData, OutputFormat, HoldTypeConfig, HoldTypesConfig, } from './types.js';
export { generateSvg } from './svg-generator.js';
export type { SvgOptions } from './svg-generator.js';
export { composeAllRoutes, composeRoute, extractHolds, parseHold, getRouteHolds } from './route-composer.js';
export type { ComposedHold } from './route-composer.js';
export { parseHoldSvg, loadHoldSvg, clearSvgCache, loadHoldTypesConfig, getHoldTypeConfig, getHoldDefaultOrientation, getHoldDimensions, getHoldLabelMargin, getHoldShowArrow, clearHoldTypesConfigCache, } from './hold-svg-parser.js';
export { GRID, PANEL, ROWS, COLUMNS, PANEL_NUMBERS, PANELS_PER_LANE, getWallDimensions, getInsertPosition, parsePanelId } from './plate-grid.js';
export { calculateAngle, calculateHoldRotation, calculateRotation } from './rotation.js';
export { HOLD_SVG_CONTENT, HOLD_TYPES_CONFIG, getAvailableHoldTypes } from './bundled-assets.js';
//# sourceMappingURL=index.d.ts.map