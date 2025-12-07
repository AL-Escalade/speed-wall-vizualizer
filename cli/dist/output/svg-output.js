/**
 * SVG output handler
 */
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
/**
 * Write SVG content to file
 * @param svgContent - SVG content to write
 * @param outputPath - Output file path
 */
export async function writeSvg(svgContent, outputPath) {
    // Create parent directory if it doesn't exist
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, svgContent, 'utf-8');
}
