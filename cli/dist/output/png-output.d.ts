/**
 * PNG output handler (requires @resvg/resvg-js)
 * Uses resvg for excellent SVG support including text attributes like dominant-baseline
 */
/**
 * Convert SVG to PNG and write to file
 * @param svgContent - SVG content to convert
 * @param outputPath - Output file path
 * @param density - Pixels per mm (default: 0.5, giving ~3000px width for a 2-lane wall)
 */
export declare function writePng(svgContent: string, outputPath: string, density?: number): Promise<void>;
