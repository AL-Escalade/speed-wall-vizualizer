import { describe, it, expect } from 'vitest';
import { generateSvg, layoutHoldLabels, layoutLabels } from './svg-generator.js';
import { loadHoldSvg } from './hold-svg-parser.js';
import { labelBox } from './label-placement.js';
import { overlapArea } from './polygon-clip.js';
import { applyMatrix, parseTransformList } from './svg-transform.js';
import type { Column, Config, ComposedSmearingZone } from './types.js';
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

  it('should translate the hold label into the requested language', async () => {
    const labeledHold: ComposedHold = {
      ...basicHold,
      label: 'M1',
    };
    const svg = await generateSvg(basicConfig, [labeledHold], { holdLabelLanguage: 'en' });
    expect(svg).toContain('>H1<');
    expect(svg).not.toContain('>M1<');
  });

  it('should render the hold label in French when no language is given', async () => {
    const labeledHold: ComposedHold = {
      ...basicHold,
      label: 'M1',
    };
    const svg = await generateSvg(basicConfig, [labeledHold]);
    expect(svg).toContain('>M1<');
    expect(svg).not.toContain('>H1<');
  });

  it('should render in the default language when the option is explicitly undefined', async () => {
    // `{ ...DEFAULT_OPTIONS, ...options }` lets an explicit undefined win over the
    // default, which a caller reaches with `{ holdLabelLanguage: prefs?.lang }`.
    const labeledHold: ComposedHold = {
      ...basicHold,
      label: 'M1',
    };
    const svg = await generateSvg(basicConfig, [labeledHold], { holdLabelLanguage: undefined });
    expect(svg).toContain('>M1<');
  });

  it('should render an empty label as empty rather than as the hold number', async () => {
    const labeledHold: ComposedHold = {
      ...basicHold,
      label: '',
    };
    // Coordinate labels also emit ">1<", so they are turned off to isolate the hold's own label
    const svg = await generateSvg(basicConfig, [labeledHold], { showCoordinateLabels: false });
    expect(svg).not.toMatch(/>1</);
  });

  it('should use composedHoldNumber as label when label is not defined', async () => {
    const svg = await generateSvg(basicConfig, [basicHold]);
    // The label should contain the composed hold number (1)
    expect(svg).toMatch(/>1</); // Text content
  });

  describe('hold label placement', () => {
    const WALL: Config = { wall: { lanes: 1, panelsHeight: 10 }, routes: [] };
    const COLUMNS = 'ABCDEFGHIJK';
    const LABEL_PATTERN = /<g id="hold-labels">\s*<text x="([^"]+)" y="([^"]+)" transform="rotate\(([^,]+), [^)]*\)"[^>]*font-size="([^"]+)"[^>]*>([^<]+)<\/text>/;

    /** A labelled hold on SN5 F5 pointing dColumn columns right and dRow rows up */
    function holdPointingTo(type: string, dColumn: number, dRow: number): ComposedHold {
      return {
        ...basicHold,
        type,
        panel: { side: 'SN', number: 5 },
        position: { column: 'F', row: 5 },
        orientation: { column: COLUMNS[5 + dColumn] as Column, row: 5 + dRow },
        label: 'M12',
      };
    }

    const TARGETS: [number, number][] = [];
    for (let dColumn = -3; dColumn <= 3; dColumn++) {
      for (let dRow = -3; dRow <= 3; dRow++) {
        if (dColumn !== 0 || dRow !== 0) TARGETS.push([dColumn, dRow]);
      }
    }

    /**
     * Overlap between the rendered label box and the hold outline placed with
     * the transform actually rendered — independent of the placement matrix.
     */
    async function renderedOwnOverlap(hold: ComposedHold, fontSize: number): Promise<number> {
      const svg = await generateSvg(WALL, [hold], { holdLabelFontSize: fontSize, showGrid: false, showCoordinateLabels: false });
      const [, transform] = /<g transform="([^"]+)"[^>]*class="hold"/.exec(svg)!;
      const [, x, y, angle, size, text] = LABEL_PATTERN.exec(svg)!;
      const width = text.length * 0.65 * Number(size);
      const box = labelBox({ x: Number(x), y: Number(y) }, width, Number(size), Number(angle));
      const matrix = parseTransformList(transform);
      const { outline } = await loadHoldSvg(hold.type);
      return outline.reduce((sum, polygon) => sum + overlapArea(polygon.map((p) => applyMatrix(matrix, p)), box), 0);
    }

    it.each(['BIG', 'FOOT', 'BIG-DE15', 'FOOT-DE15', 'STOP'])(
      'never lets a %s label touch its hold, whatever the rotation',
      async (type) => {
        for (const fontSize of [40, 200]) {
          for (const [dColumn, dRow] of TARGETS) {
            // eslint-disable-next-line no-await-in-loop -- exhaustive geometry sweep, order irrelevant
            const overlap = await renderedOwnOverlap(holdPointingTo(type, dColumn, dRow), fontSize);
            expect(overlap, `${type} → (${dColumn}, ${dRow}) at ${fontSize}px`).toBeLessThanOrEqual(1e-6);
          }
        }
      }
    );

    it('turns the label by the zone angle minus the hold rotation', async () => {
      // BIG pointing one column right, two rows down: rotation 26.57°, zone label-down (−41.2205°)
      const hold = holdPointingTo('BIG', 1, -2);
      const [placement] = await layoutHoldLabels(WALL, [hold]);
      expect(placement.angle).toBeCloseTo(-67.79, 1);
      const [, , , angle] = LABEL_PATTERN.exec(await generateSvg(WALL, [hold]))!;
      expect(Number(angle)).toBeCloseTo(-67.79, 1);
    });

    it('writes the label exactly where layoutHoldLabels placed it', async () => {
      const hold = holdPointingTo('FOOT', 2, 1);
      const [placement] = await layoutHoldLabels(WALL, [hold], { holdLabelFontSize: 120 });
      const [, x, y, angle, size, text] = LABEL_PATTERN.exec(await generateSvg(WALL, [hold], { holdLabelFontSize: 120 }))!;
      expect(Number(x)).toBe(placement.center.x);
      expect(Number(y)).toBe(placement.center.y);
      expect(Number(angle)).toBe(placement.angle);
      expect(size).toBe('120');
      expect(text).toBe('M12');
    });

    it('leaves a hold with an empty label out of the placement', async () => {
      const holds: ComposedHold[] = [holdPointingTo('BIG', 1, 1), { ...holdPointingTo('FOOT', 1, 1), position: { column: 'B', row: 5 }, label: '' }];
      const placements = await layoutHoldLabels(WALL, holds);
      expect(placements).toHaveLength(1);
      expect(placements[0].holdIndex).toBe(0);

      const svg = await generateSvg(WALL, holds);
      const [, group] = /<g id="hold-labels">([\s\S]*?)<\/g>/.exec(svg)!;
      expect(group.match(/<text/g)).toHaveLength(1);
      expect(group).toContain('>M12<');
    });

    it.each([
      [150, '150'],
      [5000, '200'],
      [850, '200'],
      [Number.NaN, '40'],
      [0, '40'],
    ])('normalises a hold label font size of %s to %s', async (fontSize, expected) => {
      const svg = await generateSvg(WALL, [holdPointingTo('BIG', 1, 1)], { holdLabelFontSize: fontSize });
      expect(LABEL_PATTERN.exec(svg)![4]).toBe(expected);
    });
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

    // Without this the plan renders in two languages at once: French hold
    // labels beside the German zone labels the DE routes are written with.
    it('should translate the zone label into the requested language', async () => {
      const germanZone: ComposedSmearingZone = { ...basicZone, label: 'R3' };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true, holdLabelLanguage: 'fr' }, [germanZone]);
      expect(svg).toContain('>A3</text>');
      expect(svg).not.toContain('>R3</text>');
    });

    it('should keep the raw zone label as the data attribute identity', async () => {
      const germanZone: ComposedSmearingZone = { ...basicZone, label: 'R3' };
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true, holdLabelLanguage: 'fr' }, [germanZone]);
      expect(svg).toContain('data-label="R3"');
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

    it('renders the zone label at its placement', async () => {
      const { zones } = await layoutLabels(basicConfig, [basicHold], { showSmearingZones: true }, [basicZone]);
      const svg = await generateSvg(basicConfig, [basicHold], { showSmearingZones: true }, [basicZone]);
      const match = /<text x="([^"]+)" y="([^"]+)" text-anchor="middle" dominant-baseline="central"[^>]*>Z1<\/text>/.exec(svg);
      expect(match).not.toBeNull();
      const [, x, y] = match!;
      expect(Number(x)).toBeCloseTo(zones[0].center.x, 6);
      expect(Number(y)).toBeCloseTo(zones[0].center.y, 6);
    });
  });
});
