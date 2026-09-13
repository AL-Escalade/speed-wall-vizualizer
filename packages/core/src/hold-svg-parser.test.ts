import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseHoldSvg,
  loadHoldSvg,
  loadHoldTypesConfig,
  getHoldTypeConfig,
  getHoldDefaultOrientation,
  getHoldDimensions,
  getHoldLabelMargin,
  getHoldShowArrow,
  clearSvgCache,
  clearHoldTypesConfigCache,
} from './hold-svg-parser.js';
import { HOLD_SVG_CONTENT, HOLD_TYPES_CONFIG } from './bundled-assets.js';
import { aabb, polygonArea } from './polygon-clip.js';

describe('parseHoldSvg', () => {
  it('should parse BIG hold SVG correctly', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT.BIG);

    expect(svgData.pathElement).toContain('path');
    expect(svgData.insertCenter).toBeDefined();
    expect(svgData.insertCenter.x).toBeGreaterThan(0);
    expect(svgData.insertCenter.y).toBeGreaterThan(0);
    expect(svgData.viewBox.width).toBeGreaterThan(0);
    expect(svgData.viewBox.height).toBeGreaterThan(0);
    expect(svgData.additionalElements.length).toBeGreaterThan(0); // Has screw hole circles
  });

  it('should parse FOOT hold SVG correctly', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT.FOOT);

    expect(svgData.pathElement).toContain('path');
    expect(svgData.insertCenter).toBeDefined();
    expect(svgData.viewBox.width).toBeGreaterThan(0);
    expect(svgData.viewBox.height).toBeGreaterThan(0);
  });

  it('should parse STOP hold SVG correctly', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT.STOP);

    // STOP has no colored prise element (rect has inkscape:label="pad", not "prise")
    // So it extracts all visual elements
    expect(svgData.additionalElements.length).toBeGreaterThan(0);
  });

  it('should extract label zones from SVG', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT.BIG);

    // BIG has label zones for different directions
    expect(svgData.labelZones).toBeDefined();
    // At least some label zones should be present
    const zoneCount = Object.keys(svgData.labelZones).length;
    expect(zoneCount).toBeGreaterThan(0);
  });

  it('should throw for SVG without dimensions', () => {
    const invalidSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><circle id="insert" cx="10" cy="10" r="5"/></svg>`;
    expect(() => parseHoldSvg(invalidSvg)).toThrow('Could not determine SVG dimensions');
  });

  it('should throw for SVG without insert element', () => {
    const invalidSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 0L100 100"/></svg>`;
    expect(() => parseHoldSvg(invalidSvg)).toThrow('Circle or ellipse with id or label "insert" not found in SVG');
  });

  it('should parse SVG with ellipse insert element', () => {
    const svgWithEllipse = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <ellipse id="insert" cx="50" cy="60" rx="5" ry="3"/>
        <path id="prise" d="M10 10L90 90Z"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithEllipse);

    expect(svgData.insertCenter.x).toBe(50);
    expect(svgData.insertCenter.y).toBe(60);
  });

  it('should parse SVG with transformed insert element', () => {
    const svgWithTransform = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle id="insert" cx="10" cy="20" r="5" transform="translate(30, 40)"/>
        <path id="prise" d="M10 10L90 90Z"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithTransform);

    expect(svgData.insertCenter.x).toBe(40);
    expect(svgData.insertCenter.y).toBe(60);
  });

  it('should throw when insert element is missing cx or cy', () => {
    const svgMissingCy = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" r="5"/>
      </svg>`;
    expect(() => parseHoldSvg(svgMissingCy)).toThrow('missing cx or cy');
  });

  it('should find insert by inkscape:label when id is not set', () => {
    const svgWithLabel = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 100 100">
        <circle inkscape:label="insert" cx="25" cy="35" r="5"/>
        <path id="prise" d="M10 10L90 90Z"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithLabel);

    expect(svgData.insertCenter.x).toBe(25);
    expect(svgData.insertCenter.y).toBe(35);
  });

  it('should extract ellipses as additional elements', () => {
    const svgWithEllipses = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 90Z"/>
        <ellipse cx="20" cy="30" rx="3" ry="2"/>
        <circle cx="70" cy="80" r="4"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithEllipses);

    expect(svgData.additionalElements.length).toBe(3); // insert circle + ellipse + other circle
  });

  it('should parse BIG-DE15 hold SVG correctly', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT['BIG-DE15']);

    expect(svgData.pathElement).toContain('path');
    expect(svgData.insertCenter).toBeDefined();
    expect(svgData.insertCenter.x).toBeGreaterThan(0);
    expect(svgData.insertCenter.y).toBeGreaterThan(0);
    expect(svgData.viewBox.width).toBeGreaterThan(0);
    expect(svgData.viewBox.height).toBeGreaterThan(0);
  });

  it('should parse FOOT-DE15 hold SVG correctly', () => {
    const svgData = parseHoldSvg(HOLD_SVG_CONTENT['FOOT-DE15']);

    expect(svgData.pathElement).toContain('path');
    expect(svgData.insertCenter).toBeDefined();
    expect(svgData.viewBox.width).toBeGreaterThan(0);
    expect(svgData.viewBox.height).toBeGreaterThan(0);
  });

  it('should extract rotation from rotate transform with center point', () => {
    const svgWithRotateCenter = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 90Z" transform="rotate(45, 50, 50)"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithRotateCenter);

    expect(svgData.svgRotation).toBeCloseTo(45, 9);
  });

  it('should simplify compound paths in child elements of prise group', () => {
    const svgWithGroupPrise = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <g id="prise">
          <path d="M10 10L50 50Z M60 60L90 90Z"/>
        </g>
      </svg>`;
    const svgData = parseHoldSvg(svgWithGroupPrise);

    expect(svgData.pathElement).toBeDefined();
    expect(svgData.pathElement).toContain('M10 10L50 50Z');
    expect(svgData.pathElement).not.toContain('M60 60');
  });

  it('should throw for a transform it cannot represent', () => {
    const svgWithSkew = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 90Z" transform="skewX(10)"/>
      </svg>`;
    expect(() => parseHoldSvg(svgWithSkew)).toThrow('Unsupported transform "skewX(10)"');
  });
});

describe('loadHoldSvg', () => {
  beforeEach(() => {
    clearSvgCache();
  });

  it('should load BIG hold type', async () => {
    const svgData = await loadHoldSvg('BIG');
    expect(svgData.pathElement).toContain('path');
    expect(svgData.insertCenter).toBeDefined();
  });

  it('should be case insensitive', async () => {
    const lower = await loadHoldSvg('big');
    const upper = await loadHoldSvg('BIG');
    expect(lower.insertCenter).toEqual(upper.insertCenter);
  });

  it('should cache loaded SVGs', async () => {
    const first = await loadHoldSvg('BIG');
    const second = await loadHoldSvg('BIG');
    expect(first).toBe(second); // Same object reference
  });

  it('should throw for unknown hold type', async () => {
    await expect(loadHoldSvg('UNKNOWN')).rejects.toThrow('Unknown hold type');
  });
});

describe('loadHoldTypesConfig', () => {
  beforeEach(() => {
    clearHoldTypesConfigCache();
  });

  it('should load hold types configuration', () => {
    const config = loadHoldTypesConfig();
    expect(config).toEqual(HOLD_TYPES_CONFIG);
  });

  it('should cache the configuration', () => {
    const first = loadHoldTypesConfig();
    const second = loadHoldTypesConfig();
    expect(first).toBe(second);
  });
});

describe('getHoldTypeConfig', () => {
  it('should return config for BIG hold', () => {
    const config = getHoldTypeConfig('BIG');
    expect(config.dimensions).toEqual({ width: 350, height: 460 });
    expect(config.defaultOrientation).toBe(270);
  });

  it('should return config for FOOT hold', () => {
    const config = getHoldTypeConfig('FOOT');
    expect(config.dimensions).toEqual({ width: 70, height: 78 });
    expect(config.defaultOrientation).toBe(180);
  });

  it('should return config for STOP hold', () => {
    const config = getHoldTypeConfig('STOP');
    expect(config.dimensions).toEqual({ width: 250, height: 250 });
    expect(config.defaultOrientation).toBe(0);
    expect(config.showArrow).toBe(false);
  });

  it('should be case insensitive', () => {
    const lower = getHoldTypeConfig('big');
    const upper = getHoldTypeConfig('BIG');
    expect(lower).toEqual(upper);
  });

  it('should throw for unknown hold type', () => {
    expect(() => getHoldTypeConfig('UNKNOWN')).toThrow('Unknown hold type');
  });
});

describe('getHoldDefaultOrientation', () => {
  it('should return 270 for BIG', () => {
    expect(getHoldDefaultOrientation('BIG')).toBe(270);
  });

  it('should return 180 for FOOT', () => {
    expect(getHoldDefaultOrientation('FOOT')).toBe(180);
  });

  it('should return 0 for STOP', () => {
    expect(getHoldDefaultOrientation('STOP')).toBe(0);
  });
});

describe('getHoldDimensions', () => {
  it('should return dimensions for BIG', () => {
    const dims = getHoldDimensions('BIG');
    expect(dims.width).toBe(350);
    expect(dims.height).toBe(460);
  });

  it('should return dimensions for FOOT', () => {
    const dims = getHoldDimensions('FOOT');
    expect(dims.width).toBe(70);
    expect(dims.height).toBe(78);
  });
});

describe('getHoldLabelMargin', () => {
  it('should return 0 when labelMargin is not defined', () => {
    // None of the default hold types define labelMargin
    expect(getHoldLabelMargin('BIG')).toBe(0);
    expect(getHoldLabelMargin('FOOT')).toBe(0);
    expect(getHoldLabelMargin('STOP')).toBe(0);
  });
});

describe('getHoldShowArrow', () => {
  it('should return true by default for BIG', () => {
    expect(getHoldShowArrow('BIG')).toBe(true);
  });

  it('should return true by default for FOOT', () => {
    expect(getHoldShowArrow('FOOT')).toBe(true);
  });

  it('should return false for STOP', () => {
    expect(getHoldShowArrow('STOP')).toBe(false);
  });
});

describe('clearSvgCache', () => {
  it('should clear the SVG cache', async () => {
    const first = await loadHoldSvg('BIG');
    clearSvgCache();
    const second = await loadHoldSvg('BIG');
    // After clearing, should be a new object
    expect(first).not.toBe(second);
    // But should have same content
    expect(first.insertCenter).toEqual(second.insertCenter);
  });
});

describe('clearHoldTypesConfigCache', () => {
  it('should clear the config cache', () => {
    const first = loadHoldTypesConfig();
    clearHoldTypesConfigCache();
    const second = loadHoldTypesConfig();
    // After clearing, they should still be equal (same data)
    expect(first).toEqual(second);
    // But might be different references (depends on implementation)
  });
});

describe('hold outlines', () => {
  // Reference areas (asset units², first subpath, 8 segments per Bézier),
  // measured independently during the spec review
  it.each([
    ['BIG', 18417.3],
    ['FOOT', 3024.3],
    ['BIG-DE15', 4123.8],
    ['FOOT-DE15', 300.5],
  ])('outlines the whole %s shape', (type, expectedArea) => {
    const { outline } = parseHoldSvg(HOLD_SVG_CONTENT[type]);
    expect(outline).toHaveLength(1);
    expect(Math.abs(polygonArea(outline[0]) - expectedArea) / expectedArea).toBeLessThan(0.01);
  });

  it('keeps the outer contour of the compound BIG path', () => {
    const box = aabb(parseHoldSvg(HOLD_SVG_CONTENT.BIG).outline[0]);
    expect(box.minX).toBeCloseTo(20.2, 1);
    expect(box.minY).toBeCloseTo(10.5, 1);
    expect(box.maxX).toBeCloseTo(199.84, 1);
    expect(box.maxY).toBeCloseTo(274.14, 1);
  });

  it('outlines the STOP pad, stroke included, when there is no prise', () => {
    const [pad] = parseHoldSvg(HOLD_SVG_CONTENT.STOP).outline;
    const expected = [
      { x: -0.6325, y: -4.1514784 },
      { x: 250.6325, y: -4.1514784 },
      { x: 250.6325, y: 247.1135216 },
      { x: -0.6325, y: 247.1135216 },
    ];
    pad.forEach((corner, i) => {
      expect(corner.x).toBeCloseTo(expected[i].x, 3);
      expect(corner.y).toBeCloseTo(expected[i].y, 3);
    });
  });

  it('composes the transforms of a <g> prise down to each path', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <g id="prise" transform="translate(10,0)">
          <path d="M0,0 L10,0 L10,10 Z" transform="scale(2)"/>
        </g>
      </svg>`;
    expect(parseHoldSvg(svg).outline).toEqual([[{ x: 10, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 20 }]]);
  });

  it('throws when there is neither a prise nor a pad to outline', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
      </svg>`;
    expect(() => parseHoldSvg(svg)).toThrow('neither a "prise" shape nor a "pad" rect');
  });
});

describe('label zone anchors', () => {
  it('reads the anchor and angle of an Inkscape zone', () => {
    const { labelZones } = parseHoldSvg(HOLD_SVG_CONTENT.BIG);
    expect(labelZones.down?.anchor.x).toBeCloseTo(145.535, 2);
    expect(labelZones.down?.anchor.y).toBeCloseTo(227.620, 2);
    expect(labelZones.down?.angle).toBeCloseTo(-41.2205, 4);
  });

  it('reads scale(-1) as a half turn', () => {
    const { labelZones } = parseHoldSvg(HOLD_SVG_CONTENT.FOOT);
    expect(labelZones.right?.angle).toBeCloseTo(180, 6);
    expect(labelZones.right?.anchor.x).toBeCloseTo(36.4947, 3);
    expect(labelZones.right?.anchor.y).toBeCloseTo(-11.1164, 3);
  });

  it('centres the STOP label under its insert', () => {
    const { labelZones, insertCenter } = parseHoldSvg(HOLD_SVG_CONTENT.STOP);
    expect(labelZones.default?.anchor.x).toBeCloseTo(insertCenter.x, 3);
    expect(labelZones.default?.anchor.y).toBeGreaterThan(insertCenter.y);
    expect(labelZones.default?.angle).toBe(0);
  });

  it('throws when a zone is not centred on its anchor', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 10L90 90Z"/>
        <text inkscape:label="label" x="5" y="5" style="text-anchor:start"><tspan x="5" y="5">M1</tspan></text>
      </svg>`;
    expect(() => parseHoldSvg(svg)).toThrow('must be centred (text-anchor: middle)');
  });
});

describe('loadHoldSvg errors', () => {
  it('names the hold type when its SVG is invalid', async () => {
    HOLD_SVG_CONTENT.BROKEN = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
      </svg>`;
    try {
      await expect(loadHoldSvg('BROKEN')).rejects.toThrow('Invalid hold SVG "BROKEN"');
    } finally {
      delete HOLD_SVG_CONTENT.BROKEN;
    }
  });
});
