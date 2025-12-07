/**
 * Output format handlers
 */
import type { OutputFormat } from '@voie-vitesse/core';
import { writeSvg } from './svg-output.js';
import { writePng } from './png-output.js';
import { writePdf } from './pdf-output.js';
/**
 * Write output in the specified format
 * @param svgContent - SVG content to output
 * @param outputPath - Output file path
 * @param format - Output format
 */
export declare function writeOutput(svgContent: string, outputPath: string, format: OutputFormat): Promise<void>;
/**
 * Get file extension for output format
 * @param format - Output format
 * @returns File extension (without dot)
 */
export declare function getExtension(format: OutputFormat): string;
/**
 * Determine output format from file extension
 * @param filePath - Output file path
 * @returns Output format or undefined if unknown
 */
export declare function formatFromPath(filePath: string): OutputFormat | undefined;
export { writeSvg, writePng, writePdf };
