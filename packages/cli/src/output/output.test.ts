import { describe, it, expect } from 'vitest';
import { getExtension, formatFromPath } from './index.js';

describe('getExtension', () => {
  it('should return svg for svg format', () => {
    expect(getExtension('svg')).toBe('svg');
  });

  it('should return png for png format', () => {
    expect(getExtension('png')).toBe('png');
  });

  it('should return pdf for pdf format', () => {
    expect(getExtension('pdf')).toBe('pdf');
  });
});

describe('formatFromPath', () => {
  it('should detect svg format from path', () => {
    expect(formatFromPath('output.svg')).toBe('svg');
    expect(formatFromPath('/path/to/output.svg')).toBe('svg');
    expect(formatFromPath('output.SVG')).toBe('svg');
  });

  it('should detect png format from path', () => {
    expect(formatFromPath('output.png')).toBe('png');
    expect(formatFromPath('/path/to/output.png')).toBe('png');
    expect(formatFromPath('output.PNG')).toBe('png');
  });

  it('should detect pdf format from path', () => {
    expect(formatFromPath('output.pdf')).toBe('pdf');
    expect(formatFromPath('/path/to/output.pdf')).toBe('pdf');
    expect(formatFromPath('output.PDF')).toBe('pdf');
  });

  it('should return undefined for unknown extensions', () => {
    expect(formatFromPath('output.jpg')).toBeUndefined();
    expect(formatFromPath('output.txt')).toBeUndefined();
    expect(formatFromPath('noextension')).toBeUndefined();
  });
});
