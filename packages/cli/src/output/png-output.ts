/**
 * PNG output handler (requires @resvg/resvg-js)
 * Uses resvg for excellent SVG support including text attributes like dominant-baseline
 */

import { writeFile } from 'fs/promises';

/** Default density in pixels per mm (results in ~A3 width for a 2-lane wall) */
const DEFAULT_DENSITY_PX_PER_MM = 0.5;

/** Maximum dimension in pixels */
const MAX_DIMENSION_PX = 16000;

/**
 * Convert SVG to PNG and write to file
 * @param svgContent - SVG content to convert
 * @param outputPath - Output file path
 * @param density - Pixels per mm (default: 0.5, giving ~3000px width for a 2-lane wall)
 */
export async function writePng(
  svgContent: string,
  outputPath: string,
  density: number = DEFAULT_DENSITY_PX_PER_MM
): Promise<void> {
  try {
    const { Resvg } = await import('@resvg/resvg-js');

    // Extract dimensions from SVG (in mm)
    const widthMatch = svgContent.match(/width\s*=\s*["']([0-9.]+)mm["']/);
    const heightMatch = svgContent.match(/height\s*=\s*["']([0-9.]+)mm["']/);

    if (!widthMatch || !heightMatch) {
      throw new Error('Could not extract dimensions from SVG. Ensure width and height are in mm.');
    }

    const widthMm = parseFloat(widthMatch[1]);
    const heightMm = parseFloat(heightMatch[1]);

    // Calculate target dimensions
    let targetWidth = Math.round(widthMm * density);
    let targetHeight = Math.round(heightMm * density);

    // Scale down if exceeding limits
    if (targetWidth > MAX_DIMENSION_PX || targetHeight > MAX_DIMENSION_PX) {
      const scale = Math.min(MAX_DIMENSION_PX / targetWidth, MAX_DIMENSION_PX / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
      console.log(`  Scaled down to ${targetWidth}x${targetHeight}px to stay within limits`);
    }

    const resvg = new Resvg(svgContent, {
      fitTo: {
        mode: 'width',
        value: targetWidth,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    await writeFile(outputPath, pngBuffer);

    console.log(`  Output size: ${targetWidth}x${pngData.height}px`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('PNG output requires the "@resvg/resvg-js" package. Install it with: npm install @resvg/resvg-js');
    }
    throw error;
  }
}
