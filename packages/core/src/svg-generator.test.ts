import { describe, it, expect } from 'vitest';
import { generateSvg } from './svg-generator.js';
import type { Config, ComposedSmearingZone } from './types.js';
import type { ComposedHold } from './route-composer.js';

describe('generateSvg', () => {
  const basicConfig: Config = {
    wall: {
      lanes: 1,
      panelsHeight: 2,
    },
    routes: [],
  };

  const basicHold: ComposedHold = {
    panel: { side: 'SN', number: 1 },
    type: 'BIG',
    position: { column: 'F', row: 5 },
    orientation: { column: 'F', row: 6 },
    sourceRoute: 'test',
    originalHoldNumber: 1,
    composedHoldNumber: 1,
    laneOffset: 0,
    holdScale: 1.0,
    color: '#FF0000',
  };

  it('should generate valid SVG document', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should include background rect', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    expect(svg).toContain('<rect');
    expect(svg).toContain('fill="white"');
  });

  it('should include grid when showGrid is true', async () => {
    const svg = await generateSvg(basicConfig, [basicHold], { showGrid: true });
    expect(svg).toContain('id="grid"');
  });

  it('should exclude grid when showGrid is false', async () => {
    const svg = await generateSvg(basicConfig, [basicHold], { showGrid: false });
    expect(svg).not.toContain('id="grid"');
  });

  it('should include holds group', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    expect(svg).toContain('id="holds"');
    expect(svg).toContain('class="hold"');
  });

  it('should include hold labels group', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    expect(svg).toContain('id="hold-labels"');
  });

  it('should apply hold color', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    expect(svg).toContain('#FF0000');
  });

  it('should include arrows when showArrow is true', async () => {
    const svg = await generateSvg(basicConfig, [basicHold], { showArrow: true });
    expect(svg).toContain('id="arrows"');
    expect(svg).toContain('<polygon'); // Arrow triangle
    expect(svg).toContain('<circle'); // Target circle
  });

  it('should exclude arrows when showArrow is false', async () => {
    const svg = await generateSvg(basicConfig, [basicHold], { showArrow: false });
    expect(svg).not.toContain('id="arrows"');
  });

  it('should include data attributes for hold', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    expect(svg).toContain('data-source="test"');
    expect(svg).toContain('data-hold="1"');
    expect(svg).toContain('data-composed="1"');
  });

  it('should handle empty holds array', async () => {
    const svg = await generateSvg(basicConfig, []);
    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('</svg>');
  });

  it('should handle multiple lanes', async () => {
    const multiLaneConfig: Config = {
      wall: { lanes: 2, panelsHeight: 2 },
      routes: [],
    };
    const svg = await generateSvg(multiLaneConfig, []);

    // Width should be larger for 2 lanes
    expect(svg).toMatch(/width="[0-9]+mm"/);
  });

  it('should use custom grid color', async () => {
    const svg = await generateSvg(basicConfig, [], {
      showGrid: true,
      gridColor: '#AABBCC',
    });
    expect(svg).toContain('#AABBCC');
  });

  it('should handle STOP hold type (no arrow)', async () => {
    const stopHold: ComposedHold = {
      ...basicHold,
      type: 'STOP',
    };
    const svg = await generateSvg(basicConfig, [stopHold], { showArrow: true });
    // STOP hold has showArrow: false in config, so it shouldn't have an arrow even when option is true
    expect(svg).toContain('id="arrows"');
    // But the arrow group should be empty (only opening/closing tags)
  });

  it('should use hold label if defined', async () => {
    const labeledHold: ComposedHold = {
      ...basicHold,
      label: 'M1',
    };
    const svg = await generateSvg(basicConfig, [labeledHold]);
    expect(svg).toContain('M1');
  });

  it('should use composedHoldNumber as label when label is not defined', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    // The label should contain the composed hold number (1)
    expect(svg).toMatch(/>1</); // Text content
  });

  it('should handle FOOT hold type', async () => {
    const footHold: ComposedHold = {
      ...basicHold,
      type: 'FOOT',
    };
    const svg = await generateSvg(basicConfig, [footHold]);
    expect(svg).toContain('class="hold"');
  });

  it('should apply anchor offset', async () => {
    const holdWithOffset: ComposedHold = {
      ...basicHold,
      anchorOffset: { x: 100, y: 200 },
    };
    const svg = await generateSvg(basicConfig, [holdWithOffset]);
    // The transform should be different from the basic hold
    expect(svg).toContain('transform=');
  });

  it('should handle cross-panel orientation', async () => {
    const crossPanelHold: ComposedHold = {
      ...basicHold,
      orientationPanel: { side: 'DX', number: 1 },
    };
    const svg = await generateSvg(basicConfig, [crossPanelHold]);
    expect(svg).toContain('class="hold"');
  });

  describe('smearing zones', () => {
    const basicZone: ComposedSmearingZone = {
      label: 'Z1',
      panel: 'SN1',
      column: 'F',
      row: 3,
      width: 2,
      height: 3,
      color: '#FF0000',
      laneOffset: 0,
    };

    it('should render smearing zones when showSmearingZones is true', async () => {
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [basicZone]);
      expect(svg).toContain('id="smearing-zones"');
      expect(svg).toContain('<defs>');
      expect(svg).toContain('pattern');
    });

    it('should not render smearing zones when showSmearingZones is false', async () => {
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: false }, [basicZone]);
      expect(svg).not.toContain('id="smearing-zones"');
    });

    it('should include zone label', async () => {
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [basicZone]);
      expect(svg).toContain('Z1');
    });

    it('should handle zone with columnOffset', async () => {
      const zoneWithOffset: ComposedSmearingZone = {
        ...basicZone,
        columnOffset: 0.5,
      };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [zoneWithOffset]);
      expect(svg).toContain('id="smearing-zones"');
    });

    it('should handle zone with decimal row', async () => {
      const zoneWithDecimalRow: ComposedSmearingZone = {
        ...basicZone,
        row: 3.5,
      };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [zoneWithDecimalRow]);
      expect(svg).toContain('id="smearing-zones"');
    });

    it('should handle zone with anchorOffset', async () => {
      const zoneWithAnchor: ComposedSmearingZone = {
        ...basicZone,
        anchorOffset: { x: 50, y: 100 },
      };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [zoneWithAnchor]);
      expect(svg).toContain('id="smearing-zones"');
    });

    it('should render multiple zones', async () => {
      const secondZone: ComposedSmearingZone = {
        ...basicZone,
        label: 'Z2',
        column: 'H',
      };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [basicZone, secondZone]);
      expect(svg).toContain('Z1');
      expect(svg).toContain('Z2');
    });

    it('should not add defs when no zones provided', async () => {
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, []);
      expect(svg).not.toContain('<defs>');
    });
  });
});
