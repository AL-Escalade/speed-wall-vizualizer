/**
 * PDF output handler (requires pdfkit and svg-to-pdfkit)
 */
/**
 * Convert SVG to PDF and write to file
 * The SVG is scaled to fit on A4 portrait with margins.
 *
 * @param svgContent - SVG content to convert
 * @param outputPath - Output file path
 */
export declare function writePdf(svgContent: string, outputPath: string): Promise<void>;
