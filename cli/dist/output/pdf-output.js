/**
 * PDF output handler (requires pdfkit and svg-to-pdfkit)
 */
import { createWriteStream } from 'fs';
/** A4 dimensions in points (1 point = 1/72 inch) */
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
/** Margin in points */
const MARGIN_PT = 28.35; // 10mm
/**
 * Convert SVG to PDF and write to file
 * The SVG is scaled to fit on A4 portrait with margins.
 *
 * @param svgContent - SVG content to convert
 * @param outputPath - Output file path
 */
export async function writePdf(svgContent, outputPath) {
    try {
        const PDFDocument = (await import('pdfkit')).default;
        const SVGtoPDF = (await import('svg-to-pdfkit')).default;
        // Extract dimensions from SVG (in mm)
        const widthMatch = svgContent.match(/width\s*=\s*["']([0-9.]+)mm["']/);
        const heightMatch = svgContent.match(/height\s*=\s*["']([0-9.]+)mm["']/);
        if (!widthMatch || !heightMatch) {
            throw new Error('Could not extract dimensions from SVG. Ensure width and height are in mm.');
        }
        const svgWidthMm = parseFloat(widthMatch[1]);
        const svgHeightMm = parseFloat(heightMatch[1]);
        // Convert mm to points (1mm = 2.83465 points)
        const mmToPoints = 2.83465;
        const svgWidthPt = svgWidthMm * mmToPoints;
        const svgHeightPt = svgHeightMm * mmToPoints;
        // Calculate usable area on A4
        const usableWidth = A4_WIDTH_PT - 2 * MARGIN_PT;
        const usableHeight = A4_HEIGHT_PT - 2 * MARGIN_PT;
        // Calculate scale to fit content in usable area
        const scaleX = usableWidth / svgWidthPt;
        const scaleY = usableHeight / svgHeightPt;
        const scale = Math.min(scaleX, scaleY);
        // Calculate final dimensions
        const finalWidth = svgWidthPt * scale;
        const finalHeight = svgHeightPt * scale;
        // Center on page
        const offsetX = MARGIN_PT + (usableWidth - finalWidth) / 2;
        const offsetY = MARGIN_PT + (usableHeight - finalHeight) / 2;
        console.log(`  Scaling SVG to ${Math.round(scale * 100)}% to fit A4`);
        const doc = new PDFDocument({
            size: 'A4',
            margin: 0,
        });
        const writeStream = createWriteStream(outputPath);
        doc.pipe(writeStream);
        // Render SVG to PDF
        SVGtoPDF(doc, svgContent, offsetX, offsetY, {
            width: finalWidth,
            height: finalHeight,
            preserveAspectRatio: 'xMidYMid meet',
        });
        doc.end();
        // Wait for write to complete
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }
    catch (error) {
        if (error.code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error('PDF output requires "pdfkit" and "svg-to-pdfkit" packages. Install with: npm install pdfkit svg-to-pdfkit');
        }
        throw error;
    }
}
