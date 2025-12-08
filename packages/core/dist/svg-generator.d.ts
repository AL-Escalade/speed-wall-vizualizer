/**
 * SVG Generator for speed climbing wall visualization
 */
import type { Config } from './types.js';
import type { ComposedHold } from './route-composer.js';
/** SVG generation options */
export interface SvgOptions {
    /** Show insert grid */
    showGrid?: boolean;
    /** Show panel labels */
    showPanelLabels?: boolean;
    /** Show column/row labels */
    showCoordinateLabels?: boolean;
    /** Grid color (inserts and coordinate labels) */
    gridColor?: string;
    /** Grid line width */
    gridLineWidth?: number;
    /** Insert marker radius */
    insertRadius?: number;
    /** Font size for coordinate labels (A-L, 1-10) */
    labelFontSize?: number;
    /** Font size for hold number labels */
    holdLabelFontSize?: number;
    /** Show arrow indicators for hold orientation */
    showArrow?: boolean;
}
/**
 * Generate full SVG document
 */
export declare function generateSvg(config: Config, holds: ComposedHold[], options?: SvgOptions): Promise<string>;
//# sourceMappingURL=svg-generator.d.ts.map