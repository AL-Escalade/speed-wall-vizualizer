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
export async function writeOutput(
  svgContent: string,
  outputPath: string,
  format: OutputFormat
): Promise<void> {
  switch (format) {
    case 'svg':
      await writeSvg(svgContent, outputPath);
      break;
    case 'png':
      await writePng(svgContent, outputPath);
      break;
    case 'pdf':
      await writePdf(svgContent, outputPath);
      break;
    default:
      throw new Error(`Unknown output format: ${format}`);
  }
}

/**
 * Get file extension for output format
 * @param format - Output format
 * @returns File extension (without dot)
 */
export function getExtension(format: OutputFormat): string {
  return format;
}

/**
 * Determine output format from file extension
 * @param filePath - Output file path
 * @returns Output format or undefined if unknown
 */
export function formatFromPath(filePath: string): OutputFormat | undefined {
  const ext = filePath.toLowerCase().split('.').pop();
  if (ext === 'svg' || ext === 'png' || ext === 'pdf') {
    return ext;
  }
  return undefined;
}

export { writeSvg, writePng, writePdf };
