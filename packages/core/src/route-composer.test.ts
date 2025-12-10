import { describe, it, expect } from 'vitest';
import {
  parseHold,
  getRouteHolds,
  extractHolds,
  composeRoute,
  composeAllRoutes,
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
