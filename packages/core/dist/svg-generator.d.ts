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
    /** Grid line color */
    gridColor?: string;
    /** Grid line width */
    gridLineWidth?: number;
    /** Insert marker radius */
    insertRadius?: number;
    /** Font size for labels */
    labelFontSize?: number;
}
/**
 * Generate full SVG document
 */
export declare function generateSvg(config: Config, holds: ComposedHold[], options?: SvgOptions): Promise<string>;
//# sourceMappingURL=svg-generator.d.ts.map