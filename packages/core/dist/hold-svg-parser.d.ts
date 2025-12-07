/**
 * Parser for hold SVG files
 *
 * Hold SVG files must contain:
 * - A <path> or <g> element with id="prise" for the hold shape
 * - A <circle> element with id="insert" for the anchor point
 */
import type { HoldSvgData, Dimensions, HoldTypeConfig, HoldTypesConfig } from './types.js';
/**
 * Parse a hold SVG file
 */
export declare function parseHoldSvg(svgContent: string): HoldSvgData;
/**
 * Load and parse a hold SVG by type (from bundled assets)
 */
export declare function loadHoldSvg(holdType: string): Promise<HoldSvgData>;
/**
 * Clear the SVG cache
 */
export declare function clearSvgCache(): void;
/**
 * Load hold types configuration (from bundled assets)
 */
export declare function loadHoldTypesConfig(): HoldTypesConfig;
/**
 * Get configuration for a specific hold type
 */
export declare function getHoldTypeConfig(holdType: string): HoldTypeConfig;
/**
 * Get the default orientation for a hold type
 */
export declare function getHoldDefaultOrientation(holdType: string): number;
/**
 * Get the dimensions for a hold type
 */
export declare function getHoldDimensions(holdType: string): Dimensions;
/**
 * Get the label margin for a hold type
 */
export declare function getHoldLabelMargin(holdType: string): number;
/**
 * Clear the hold types configuration cache
 */
export declare function clearHoldTypesConfigCache(): void;
//# sourceMappingURL=hold-svg-parser.d.ts.map