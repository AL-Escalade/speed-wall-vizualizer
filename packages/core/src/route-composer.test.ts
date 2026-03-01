import { describe, it, expect } from 'vitest';
import {
  parseHold,
  getRouteHolds,
  extractHolds,
  composeRoute,
  composeAllRoutes,
  extractSmearingZones,
  composeSmearingZones,
  composeAllSmearingZones,
} from './route-composer.js';
import type { ReferenceRoute, ReferenceRoutes, RouteSegment, GeneratedRoute } from './types.js';
import { COLUMN_SYSTEMS } from './types.js';

describe('parseHold', () => {
  it('should parse basic hold format with ABC system', () => {
    const hold = parseHold('SN1 BIG A1 B2', COLUMN_SYSTEMS.ABC);
    expect(hold.panel).toEqual({ side: 'SN', number: 1 });
    expect(hold.type).toBe('BIG');
    expect(hold.position).toEqual({ column: 'A', row: 1 });
    expect(hold.orientation).toEqual({ column: 'B', row: 2 });
    expect(hold.scale).toBeUndefined();
    expect(hold.label).toBeUndefined();
  });

  it('should parse hold with scale', () => {
    const hold = parseHold('DX5 FOOT F4 G5 0.8', COLUMN_SYSTEMS.ABC);
    expect(hold.panel).toEqual({ side: 'DX', number: 5 });
    expect(hold.type).toBe('FOOT');
    expect(hold.position).toEqual({ column: 'F', row: 4 });
    expect(hold.orientation).toEqual({ column: 'G', row: 5 });
    expect(hold.scale).toBe(0.8);
  });

  it('should parse hold with label', () => {
    const hold = parseHold('SN2 BIG C3 D4 @M1', COLUMN_SYSTEMS.ABC);
    expect(hold.label).toBe('M1');
    expect(hold.scale).toBeUndefined();
  });

  it('should parse hold with both label and scale', () => {
    const hold = parseHold('SN2 BIG C3 D4 @M1 0.9', COLUMN_SYSTEMS.ABC);
    expect(hold.label).toBe('M1');
    expect(hold.scale).toBe(0.9);
  });

  it('should parse hold with cross-panel orientation', () => {
    const hold = parseHold('SN1 BIG A1 DX1:B2', COLUMN_SYSTEMS.ABC);
    expect(hold.panel).toEqual({ side: 'SN', number: 1 });
    expect(hold.orientation).toEqual({ column: 'B', row: 2 });
    expect(hold.orientationPanel).toEqual({ side: 'DX', number: 1 });
  });

  it('should convert hold type to uppercase', () => {
    const hold = parseHold('SN1 big A1 B2', COLUMN_SYSTEMS.ABC);
    expect(hold.type).toBe('BIG');
  });

  it('should throw for invalid hold format', () => {
    expect(() => parseHold('SN1 BIG A1')).toThrow('Invalid hold format');
    expect(() => parseHold('SN1 BIG A1 B2 C3 D4 E5')).toThrow('Invalid hold format');
  });

  it('should throw for invalid scale value', () => {
    expect(() => parseHold('SN1 BIG A1 B2 -0.5', COLUMN_SYSTEMS.ABC)).toThrow('Invalid scale value');
    expect(() => parseHold('SN1 BIG A1 B2 abc', COLUMN_SYSTEMS.ABC)).toThrow('Invalid scale value');
  });

  it('should convert columns from FFME to ABC system', () => {
    // K in FFME is index 9, which maps to J in ABC
    const hold = parseHold('SN1 BIG K1 L2', COLUMN_SYSTEMS.FFME);
    expect(hold.position.column).toBe('J'); // K in FFME → J in ABC
    expect(hold.orientation.column).toBe('K'); // L in FFME → K in ABC
  });
});

describe('getRouteHolds', () => {
  it('should parse all holds from a route', () => {
    const route: ReferenceRoute = {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4'],
    };

    const holds = getRouteHolds(route);
    expect(holds).toHaveLength(2);
    expect(holds[0].type).toBe('BIG');
    expect(holds[1].type).toBe('FOOT');
  });

  it('should use FFME system as default', () => {
    const route: ReferenceRoute = {
      color: '#FF0000',
      holds: ['SN1 BIG K1 L2'], // K and L in FFME
    };

    const holds = getRouteHolds(route);
    expect(holds[0].position.column).toBe('J'); // K in FFME → J in ABC
    expect(holds[0].orientation.column).toBe('K'); // L in FFME → K in ABC
  });
});

describe('extractHolds', () => {
  const routes: ReferenceRoutes = {
    test: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: [
        'SN1 BIG A1 B2 @M1',
        'SN1 FOOT C3 D4 @P1',
        'SN2 BIG E5 F6 @M2',
        'SN2 FOOT G7 H8 @P2',
      ],
    },
  };

  it('should extract all holds by default', () => {
    const segment: RouteSegment = { source: 'test' };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(4);
    expect(holds[0].sourceRoute).toBe('test');
    expect(holds[0].originalHoldNumber).toBe(1);
  });

  it('should extract holds in specified range by number', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 2, toHold: 3 };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(2);
    expect(holds[0].originalHoldNumber).toBe(2);
    expect(holds[1].originalHoldNumber).toBe(3);
  });

  it('should extract single hold when fromHold equals toHold', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 2, toHold: 2 };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(1);
    expect(holds[0].originalHoldNumber).toBe(2);
  });

  it('should extract holds in specified range by label', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 'P1', toHold: 'M2' };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(2);
    expect(holds[0].label).toBe('P1');
    expect(holds[1].label).toBe('M2');
  });

  it('should exclude specified holds by number', () => {
    const segment: RouteSegment = { source: 'test', excludeHolds: [2, 4] };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(2);
    expect(holds[0].originalHoldNumber).toBe(1);
    expect(holds[1].originalHoldNumber).toBe(3);
  });

  it('should exclude specified holds by label', () => {
    const segment: RouteSegment = { source: 'test', excludeHolds: ['P1', 'P2'] };
    const holds = extractHolds(segment, routes);
    expect(holds).toHaveLength(2);
    expect(holds[0].label).toBe('M1');
    expect(holds[1].label).toBe('M2');
  });

  it('should apply lane offset', () => {
    const segment: RouteSegment = { source: 'test', laneOffset: 1 };
    const holds = extractHolds(segment, routes);
    expect(holds[0].laneOffset).toBe(1);
  });

  it('should use segment color override', () => {
    const segment: RouteSegment = { source: 'test', color: '#00FF00' };
    const holds = extractHolds(segment, routes);
    expect(holds[0].color).toBe('#00FF00');
  });

  it('should use route color by default', () => {
    const segment: RouteSegment = { source: 'test' };
    const holds = extractHolds(segment, routes);
    expect(holds[0].color).toBe('#FF0000');
  });

  it('should throw for unknown route', () => {
    const segment: RouteSegment = { source: 'unknown' };
    expect(() => extractHolds(segment, routes)).toThrow('Unknown reference route');
  });

  it('should throw for out of bounds range', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 0, toHold: 5 };
    expect(() => extractHolds(segment, routes)).toThrow('out of bounds');
  });

  it('should throw for unknown label reference', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 'UNKNOWN' };
    expect(() => extractHolds(segment, routes)).toThrow('not found in route');
  });

  it('should apply holdScales from route', () => {
    const routesWithScales: ReferenceRoutes = {
      scaled: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holdScales: { BIG: 0.8 },
        holds: ['SN1 BIG A1 B2'],
      },
    };
    const segment: RouteSegment = { source: 'scaled' };
    const holds = extractHolds(segment, routesWithScales);
    expect(holds[0].holdScale).toBe(0.8);
  });

  it('should prefer individual hold scale over route scale', () => {
    const routesWithScales: ReferenceRoutes = {
      scaled: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holdScales: { BIG: 0.8 },
        holds: ['SN1 BIG A1 B2 0.5'], // Individual scale
      },
    };
    const segment: RouteSegment = { source: 'scaled' };
    const holds = extractHolds(segment, routesWithScales);
    expect(holds[0].holdScale).toBe(0.5);
  });

  it('should compute anchor offset with virtual column A-1', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'A-1', row: 1 },
    };
    const holds = extractHolds(segment, routes);
    expect(holds[0].anchorOffset).toBeDefined();
    expect(holds[0].anchorOffset!.x).not.toBe(0);
  });

  it('should compute anchor offset with virtual column K+1', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'K+1', row: 1 },
    };
    const holds = extractHolds(segment, routes);
    expect(holds[0].anchorOffset).toBeDefined();
    expect(holds[0].anchorOffset!.x).not.toBe(0);
  });

  it('should compute anchor offset with virtual row 0', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'A', row: 0 },
    };
    const holds = extractHolds(segment, routes);
    expect(holds[0].anchorOffset).toBeDefined();
    expect(holds[0].anchorOffset!.y).not.toBe(0);
  });

  it('should compute anchor offset with virtual row 11', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'A', row: 11 },
    };
    const holds = extractHolds(segment, routes);
    expect(holds[0].anchorOffset).toBeDefined();
    expect(holds[0].anchorOffset!.y).not.toBe(0);
  });

  it('should produce same result for physical anchor as before', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'F', row: 5 },
    };
    const holds = extractHolds(segment, routes);
    expect(holds[0].anchorOffset).toBeDefined();
    // The first hold is at SN1 A1, anchor at SN1 F5
    // offset = anchor - hold position
    expect(typeof holds[0].anchorOffset!.x).toBe('number');
    expect(typeof holds[0].anchorOffset!.y).toBe('number');
  });
});

describe('composeRoute', () => {
  const routes: ReferenceRoutes = {
    route1: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4'],
    },
    route2: {
      color: '#00FF00',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN2 BIG E5 F6'],
    },
  };

  it('should compose holds from multiple segments', () => {
    const segments: RouteSegment[] = [
      { source: 'route1' },
      { source: 'route2' },
    ];
    const composed = composeRoute(segments, routes);
    expect(composed).toHaveLength(3);
    expect(composed[0].composedHoldNumber).toBe(1);
    expect(composed[1].composedHoldNumber).toBe(2);
    expect(composed[2].composedHoldNumber).toBe(3);
  });

  it('should number holds sequentially across segments', () => {
    const segments: RouteSegment[] = [
      { source: 'route1', toHold: 1 },
      { source: 'route2' },
    ];
    const composed = composeRoute(segments, routes);
    expect(composed).toHaveLength(2);
    expect(composed[0].composedHoldNumber).toBe(1);
    expect(composed[1].composedHoldNumber).toBe(2);
  });
});

describe('composeAllRoutes', () => {
  const routes: ReferenceRoutes = {
    route1: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2'],
    },
  };

  it('should compose all generated routes', () => {
    const generatedRoutes: GeneratedRoute[] = [
      { segments: [{ source: 'route1' }] },
      { segments: [{ source: 'route1' }] },
    ];
    const allHolds = composeAllRoutes(generatedRoutes, routes);
    expect(allHolds).toHaveLength(2);
  });
});

describe('extractSmearingZones', () => {
  const routes: ReferenceRoutes = {
    test: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: [
        'SN1 BIG A1 B2 @M1',
        'SN1 FOOT C3 D4 @P1',
        'SN1 BIG E5 F6 @M2',
        'SN1 FOOT G7 H8 @P2',
      ],
      smearingZones: [
        { label: 'Z1', panel: 'SN1', column: 'B', row: 2, width: 2, height: 3 },
        { label: 'Z2', panel: 'SN1', column: 'D', row: 6, width: 1, height: 2 },
      ],
    },
  };

  it('should extract all zones when no hold filter is specified', () => {
    const segment: RouteSegment = { source: 'test' };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    expect(zones).toHaveLength(2);
    expect(zones[0].label).toBe('Z1');
    expect(zones[1].label).toBe('Z2');
  });

  it('should return empty array for unknown route', () => {
    const segment: RouteSegment = { source: 'unknown' };
    const zones = extractSmearingZones(segment, routes, []);
    expect(zones).toHaveLength(0);
  });

  it('should return empty array for route without zones', () => {
    const routesNoZones: ReferenceRoutes = {
      nozones: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2'],
      },
    };
    const segment: RouteSegment = { source: 'nozones' };
    const holds = extractHolds(segment, routesNoZones);
    const zones = extractSmearingZones(segment, routesNoZones, holds);
    expect(zones).toHaveLength(0);
  });

  it('should filter zones by hold overlap when fromHold is specified', () => {
    const segment: RouteSegment = { source: 'test', fromHold: 1, toHold: 2 };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    // Only Z1 should be included (rows 2-5 overlap with holds at rows 1 and 3)
    expect(zones).toHaveLength(1);
    expect(zones[0].label).toBe('Z1');
  });

  it('should apply lane offset to zones', () => {
    const segment: RouteSegment = { source: 'test', laneOffset: 1 };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    expect(zones[0].laneOffset).toBe(1);
  });

  it('should use segment color override', () => {
    const segment: RouteSegment = { source: 'test', color: '#00FF00' };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    expect(zones[0].color).toBe('#00FF00');
  });

  it('should use route color by default', () => {
    const segment: RouteSegment = { source: 'test' };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    expect(zones[0].color).toBe('#FF0000');
  });

  it('should convert columns from FFME to ABC system', () => {
    const routesFFME: ReferenceRoutes = {
      ffme: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.FFME,
        holds: ['SN1 BIG K1 L2'], // K, L in FFME
        smearingZones: [
          { label: 'Z1', panel: 'SN1', column: 'K', row: 1, width: 2, height: 2 }, // K in FFME
        ],
      },
    };
    const segment: RouteSegment = { source: 'ffme' };
    const holds = extractHolds(segment, routesFFME);
    const zones = extractSmearingZones(segment, routesFFME, holds);
    expect(zones[0].column).toBe('J'); // K in FFME → J in ABC
  });

  it('should calculate anchor offset when segment has anchor', () => {
    const segment: RouteSegment = {
      source: 'test',
      anchor: { panel: 'SN1', column: 'A', row: 5 },
    };
    const holds = extractHolds(segment, routes);
    const zones = extractSmearingZones(segment, routes, holds);
    expect(zones[0].anchorOffset).toBeDefined();
    expect(zones[0].anchorOffset?.x).toBeDefined();
    expect(zones[0].anchorOffset?.y).toBeDefined();
  });

  it('should pass through columnOffset if present', () => {
    const routesWithOffset: ReferenceRoutes = {
      withoffset: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2'],
        smearingZones: [
          { label: 'Z1', panel: 'SN1', column: 'B', row: 2, width: 2, height: 3, columnOffset: 0.5 },
        ],
      },
    };
    const segment: RouteSegment = { source: 'withoffset' };
    const holds = extractHolds(segment, routesWithOffset);
    const zones = extractSmearingZones(segment, routesWithOffset, holds);
    expect(zones[0].columnOffset).toBe(0.5);
  });

  it('should handle decimal row values', () => {
    const routesWithDecimalRow: ReferenceRoutes = {
      decimal: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2'],
        smearingZones: [
          { label: 'Z1', panel: 'SN1', column: 'B', row: 2.5, width: 2, height: 3 },
        ],
      },
    };
    const segment: RouteSegment = { source: 'decimal' };
    const holds = extractHolds(segment, routesWithDecimalRow);
    const zones = extractSmearingZones(segment, routesWithDecimalRow, holds);
    expect(zones[0].row).toBe(2.5);
  });
});

describe('composeSmearingZones', () => {
  const routes: ReferenceRoutes = {
    route1: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4'],
      smearingZones: [
        { label: 'Z1', panel: 'SN1', column: 'B', row: 2, width: 2, height: 3 },
      ],
    },
    route2: {
      color: '#00FF00',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN2 BIG E5 F6'],
      smearingZones: [
        { label: 'Z2', panel: 'SN2', column: 'F', row: 5, width: 1, height: 2 },
      ],
    },
  };

  it('should compose zones from multiple segments', () => {
    const segments: RouteSegment[] = [
      { source: 'route1' },
      { source: 'route2' },
    ];
    const composedHolds = composeRoute(segments, routes);
    const zones = composeSmearingZones(segments, routes, composedHolds);
    expect(zones).toHaveLength(2);
    expect(zones[0].label).toBe('Z1');
    expect(zones[1].label).toBe('Z2');
  });

  it('should handle segments without zones', () => {
    const routesNoZone: ReferenceRoutes = {
      nozone: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2'],
      },
    };
    const segments: RouteSegment[] = [{ source: 'nozone' }];
    const composedHolds = composeRoute(segments, routesNoZone);
    const zones = composeSmearingZones(segments, routesNoZone, composedHolds);
    expect(zones).toHaveLength(0);
  });

  it('should correctly track holds across segments', () => {
    const segments: RouteSegment[] = [
      { source: 'route1', toHold: 1 },
      { source: 'route2' },
    ];
    const composedHolds = composeRoute(segments, routes);
    const zones = composeSmearingZones(segments, routes, composedHolds);
    // Should have zones from both segments
    expect(zones.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle segments with different lane offsets', () => {
    const segments: RouteSegment[] = [
      { source: 'route1', laneOffset: 0 },
      { source: 'route1', laneOffset: 1 },
    ];
    const composedHolds = composeRoute(segments, routes);
    const zones = composeSmearingZones(segments, routes, composedHolds);
    expect(zones).toHaveLength(2);
    expect(zones[0].laneOffset).toBe(0);
    expect(zones[1].laneOffset).toBe(1);
  });
});

describe('composeAllSmearingZones', () => {
  const routes: ReferenceRoutes = {
    route1: {
      color: '#FF0000',
      columns: COLUMN_SYSTEMS.ABC,
      holds: ['SN1 BIG A1 B2'],
      smearingZones: [
        { label: 'Z1', panel: 'SN1', column: 'B', row: 1, width: 2, height: 2 },
      ],
    },
  };

  it('should compose all zones from generated routes', () => {
    const generatedRoutes: GeneratedRoute[] = [
      { segments: [{ source: 'route1' }] },
      { segments: [{ source: 'route1' }] },
    ];
    const allHolds = composeAllRoutes(generatedRoutes, routes);
    const allZones = composeAllSmearingZones(generatedRoutes, routes, allHolds);
    expect(allZones).toHaveLength(2);
  });

  it('should handle empty generated routes', () => {
    const generatedRoutes: GeneratedRoute[] = [];
    const allHolds = composeAllRoutes(generatedRoutes, routes);
    const allZones = composeAllSmearingZones(generatedRoutes, routes, allHolds);
    expect(allZones).toHaveLength(0);
  });

  it('should handle unknown routes gracefully', () => {
    const generatedRoutes: GeneratedRoute[] = [
      { segments: [{ source: 'unknown' }] },
    ];
    // Unknown route will have 0 holds
    const allZones = composeAllSmearingZones(generatedRoutes, routes, []);
    expect(allZones).toHaveLength(0);
  });

  it('should correctly count holds with excludeHolds', () => {
    const routesWithExcludes: ReferenceRoutes = {
      test: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4', 'SN1 BIG E5 F6'],
        smearingZones: [
          { label: 'Z1', panel: 'SN1', column: 'B', row: 1, width: 2, height: 6 },
        ],
      },
    };
    const generatedRoutes: GeneratedRoute[] = [
      { segments: [{ source: 'test', excludeHolds: [2] }] },
    ];
    const allHolds = composeAllRoutes(generatedRoutes, routesWithExcludes);
    expect(allHolds).toHaveLength(2); // 3 holds - 1 excluded
    const allZones = composeAllSmearingZones(generatedRoutes, routesWithExcludes, allHolds);
    expect(allZones).toHaveLength(1);
  });

  it('should correctly handle fromHold and toHold in hold counting', () => {
    const routesMultiHold: ReferenceRoutes = {
      multi: {
        color: '#FF0000',
        columns: COLUMN_SYSTEMS.ABC,
        holds: ['SN1 BIG A1 B2', 'SN1 FOOT C3 D4', 'SN1 BIG E5 F6', 'SN1 FOOT G7 H8'],
        smearingZones: [
          { label: 'Z1', panel: 'SN1', column: 'B', row: 1, width: 2, height: 8 },
        ],
      },
    };
    const generatedRoutes: GeneratedRoute[] = [
      { segments: [{ source: 'multi', fromHold: 2, toHold: 3 }] },
    ];
    const allHolds = composeAllRoutes(generatedRoutes, routesMultiHold);
    expect(allHolds).toHaveLength(2); // holds 2 and 3
    const allZones = composeAllSmearingZones(generatedRoutes, routesMultiHold, allHolds);
    expect(allZones).toHaveLength(1);
  });
});
