import { describe, it, expect } from 'vitest';
import { sectionToSegment, normalizeSvgForWeb, type WebSection } from './sectionMapper';

describe('sectionToSegment', () => {
  it('should convert basic section to segment', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 20,
      color: '#FF0000',
    };

    const segment = sectionToSegment(section);

    expect(segment.source).toBe('ifsc');
    expect(segment.laneOffset).toBe(0);
    expect(segment.fromHold).toBe(1);
    expect(segment.toHold).toBe(20);
    expect(segment.color).toBe('#FF0000');
    expect(segment.anchor).toBeUndefined();
  });

  it('should convert section with lane offset', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 1,
      fromHold: 1,
      toHold: 10,
      color: '#00FF00',
    };

    const segment = sectionToSegment(section);
    expect(segment.laneOffset).toBe(1);
  });

  it('should convert section with anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#0000FF',
      anchor: {
        side: 'SN',
        column: 'F',
        row: 5,
      },
    };

    const segment = sectionToSegment(section);

    expect(segment.anchor).toBeDefined();
    expect(segment.anchor!.panel).toBe('SN1');
    expect(segment.anchor!.column).toBe('F');
    expect(segment.anchor!.row).toBe(5);
  });

  it('should handle DX side anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#0000FF',
      anchor: {
        side: 'DX',
        column: 'A',
        row: 1,
      },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.panel).toBe('DX1');
  });

  it('should handle virtual column A-1 in anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#FF0000',
      anchor: { side: 'SN', column: 'A-1', row: 5 },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.column).toBe('A-1');
    expect(segment.anchor!.panel).toBe('SN1');
  });

  it('should handle virtual column K+1 in anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#FF0000',
      anchor: { side: 'SN', column: 'K+1', row: 5 },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.column).toBe('K+1');
  });

  it('should handle virtual row 0 in anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#FF0000',
      anchor: { side: 'SN', column: 'A', row: 0 },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.row).toBe(0);
  });

  it('should handle virtual row 11 in anchor', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#FF0000',
      anchor: { side: 'SN', column: 'A', row: 11 },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.row).toBe(11);
  });

  it('should default multi-character column substrings like AB to A', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 1,
      toHold: 10,
      color: '#FF0000',
      anchor: { side: 'SN', column: 'AB' as never, row: 5 },
    };

    const segment = sectionToSegment(section);
    expect(segment.anchor!.column).toBe('A');
  });

  it('should handle string hold references', () => {
    const section: WebSection = {
      source: 'ifsc',
      lane: 0,
      fromHold: 'M1',
      toHold: 'M10',
      color: '#FF0000',
    };

    const segment = sectionToSegment(section);
    expect(segment.fromHold).toBe('M1');
    expect(segment.toHold).toBe('M10');
  });
});

describe('normalizeSvgForWeb', () => {
  it('should replace width and height with 100%', () => {
    const svg = '<svg width="3000mm" height="15000mm" viewBox="0 0 3000 15000"></svg>';
    const normalized = normalizeSvgForWeb(svg);

    expect(normalized).toContain('width="100%"');
    expect(normalized).toContain('height="100%"');
    expect(normalized).not.toContain('3000mm');
    expect(normalized).not.toContain('15000mm');
  });

  it('should preserve viewBox', () => {
    const svg = '<svg width="3000mm" height="15000mm" viewBox="0 0 3000 15000"></svg>';
    const normalized = normalizeSvgForWeb(svg);

    expect(normalized).toContain('viewBox="0 0 3000 15000"');
  });

  it('should handle SVG without mm units', () => {
    const svg = '<svg width="1000" height="2000" viewBox="0 0 1000 2000"></svg>';
    const normalized = normalizeSvgForWeb(svg);

    expect(normalized).toContain('width="100%"');
    expect(normalized).toContain('height="100%"');
  });

  it('should preserve other SVG content', () => {
    const svg = '<svg width="1000mm" height="2000mm"><rect x="0" y="0" width="100" height="100"/></svg>';
    const normalized = normalizeSvgForWeb(svg);

    expect(normalized).toContain('<rect');
    expect(normalized).toContain('</svg>');
  });
});
