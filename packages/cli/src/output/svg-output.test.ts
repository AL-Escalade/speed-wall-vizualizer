import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeSvg } from './svg-output';
import { writeFile, mkdir } from 'fs/promises';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

describe('writeSvg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create parent directory and write SVG content', async () => {
    const svgContent = '<svg><rect /></svg>';
    const outputPath = '/output/test/file.svg';

    await writeSvg(svgContent, outputPath);

    expect(mkdir).toHaveBeenCalledWith('/output/test', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(outputPath, svgContent, 'utf-8');
  });

  it('should handle nested directories', async () => {
    const svgContent = '<svg></svg>';
    const outputPath = '/a/b/c/d/output.svg';

    await writeSvg(svgContent, outputPath);

    expect(mkdir).toHaveBeenCalledWith('/a/b/c/d', { recursive: true });
  });

  it('should handle root level paths', async () => {
    const svgContent = '<svg></svg>';
    const outputPath = '/output.svg';

    await writeSvg(svgContent, outputPath);

    expect(mkdir).toHaveBeenCalledWith('/', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(outputPath, svgContent, 'utf-8');
  });
});
