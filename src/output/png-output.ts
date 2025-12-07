/**
 * PNG output handler (requires sharp)
 */

/**
 * Convert SVG to PNG and write to file
 * @param svgContent - SVG content to convert
 * @param outputPath - Output file path
 */
export async function writePng(svgContent: string, outputPath: string): Promise<void> {
  try {
    const sharp = await import('sharp');
    const buffer = Buffer.from(svgContent, 'utf-8');
    await sharp.default(buffer).png().toFile(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('PNG output requires the "sharp" package. Install it with: npm install sharp');
    }
    throw error;
  }
}
