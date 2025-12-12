import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractShareableConfig,
  encodeConfig,
  decodeConfig,
  hydrateShareableConfig,
  getConfigFingerprint,
  type ShareableConfig,
} from './urlConfig';
import type { SavedConfiguration } from '@/store';

// Mock crypto.randomUUID with proper UUID format
beforeEach(() => {
  let counter = 0;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(
    (): `${string}-${string}-${string}-${string}-${string}` =>
      `test-uuid-${++counter}-0000-0000-000000000000`
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractShareableConfig', () => {
  it('should extract shareable fields from SavedConfiguration', () => {
    const config: SavedConfiguration = {
      id: 'test-id',
      name: 'Test Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        {
          id: 'section-1',
          name: 'Section 1',
          source: 'ifsc',
          lane: 0,
          fromHold: 1,
          toHold: 20,
          color: '#FF0000',
        },
      ],
      showArrow: true,
      createdAt: 1000,
      updatedAt: 2000,
    };

    const shareable = extractShareableConfig(config);

    expect(shareable.wall).toEqual({ lanes: 2, panelsHeight: 10 });
    expect(shareable.sections).toHaveLength(1);
    expect(shareable.sections[0].name).toBe('Section 1');
    expect(shareable.sections[0].source).toBe('ifsc');
    expect(shareable.showArrow).toBe(true);
    // Should not include id, createdAt, updatedAt - use 'in' operator for type-safe check
    expect('id' in shareable).toBe(false);
    expect('createdAt' in shareable).toBe(false);
  });

  it('should include anchor if present', () => {
    const config: SavedConfiguration = {
      id: 'test-id',
      name: 'Test Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        {
          id: 'section-1',
          name: 'Section 1',
          source: 'ifsc',
          lane: 0,
          fromHold: 1,
          toHold: 20,
          color: '#FF0000',
          anchor: { side: 'SN', column: 'F', row: 5 },
        },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    const shareable = extractShareableConfig(config);
    expect(shareable.sections[0].anchor).toEqual({ side: 'SN', column: 'F', row: 5 });
  });

  it('should include displayOptions if present', () => {
    const config: SavedConfiguration = {
      id: 'test-id',
      name: 'Test Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      displayOptions: { gridColor: '#AAAAAA', labelFontSize: 30 },
      createdAt: 1000,
      updatedAt: 2000,
    };

    const shareable = extractShareableConfig(config);
    expect(shareable.displayOptions).toEqual({ gridColor: '#AAAAAA', labelFontSize: 30 });
  });
});

describe('encodeConfig', () => {
  it('should encode config to URL-safe string', () => {
    const config: ShareableConfig = {
      wall: { lanes: 1, panelsHeight: 5 },
      sections: [
        { name: 'Test', source: 'ifsc', lane: 0, fromHold: 1, toHold: 10, color: '#FF0000' },
      ],
    };

    const encoded = encodeConfig(config);

    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    // Should be URL-safe (no +, /, or =)
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('should handle special characters in names', () => {
    const config: ShareableConfig = {
      wall: { lanes: 1, panelsHeight: 5 },
      sections: [
        { name: 'Test éàü', source: 'ifsc', lane: 0, fromHold: 1, toHold: 10, color: '#FF0000' },
      ],
    };

    const encoded = encodeConfig(config);
    expect(encoded.length).toBeGreaterThan(0);
  });
});

describe('decodeConfig', () => {
  it('should decode a valid encoded config', () => {
    const original: ShareableConfig = {
      wall: { lanes: 2, panelsHeight: 8 },
      sections: [
        { name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#00FF00' },
      ],
    };

    const encoded = encodeConfig(original);
    const decoded = decodeConfig(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.wall).toEqual(original.wall);
    expect(decoded!.sections).toHaveLength(1);
    expect(decoded!.sections[0].name).toBe('Section');
  });

  it('should return null for invalid encoded string', () => {
    const decoded = decodeConfig('invalid-base64!@#$');
    expect(decoded).toBeNull();
  });

  it('should return null for valid base64 but invalid config structure', () => {
    const invalidJson = btoa(JSON.stringify({ foo: 'bar' }));
    const urlSafe = invalidJson.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const decoded = decodeConfig(urlSafe);
    expect(decoded).toBeNull();
  });

  it('should handle config with anchor', () => {
    const original: ShareableConfig = {
      wall: { lanes: 1, panelsHeight: 5 },
      sections: [
        {
          name: 'Section',
          source: 'ifsc',
          lane: 0,
          fromHold: 1,
          toHold: 10,
          color: '#FF0000',
          anchor: { side: 'DX', column: 'A', row: 1 },
        },
      ],
    };

    const encoded = encodeConfig(original);
    const decoded = decodeConfig(encoded);

    expect(decoded!.sections[0].anchor).toEqual({ side: 'DX', column: 'A', row: 1 });
  });
});

describe('hydrateShareableConfig', () => {
  it('should generate new IDs and timestamps', () => {
    const shareable: ShareableConfig = {
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
    };

    const hydrated = hydrateShareableConfig(shareable);

    expect(hydrated.id).toBe('test-uuid-1-0000-0000-000000000000');
    expect(hydrated.name).toBe('Configuration partagée');
    expect(hydrated.sections[0].id).toBe('test-uuid-2-0000-0000-000000000000');
    expect(typeof hydrated.createdAt).toBe('number');
    expect(typeof hydrated.updatedAt).toBe('number');
  });

  it('should preserve all shareable fields', () => {
    const shareable: ShareableConfig = {
      wall: { lanes: 1, panelsHeight: 5 },
      sections: [
        {
          name: 'Test Section',
          source: 'ifsc',
          lane: 1,
          fromHold: 'M1',
          toHold: 'M5',
          color: '#0000FF',
          anchor: { side: 'SN', column: 'F', row: 3 },
        },
      ],
      showArrow: true,
      displayOptions: { gridColor: '#CCCCCC' },
    };

    const hydrated = hydrateShareableConfig(shareable);

    expect(hydrated.wall).toEqual(shareable.wall);
    expect(hydrated.sections[0].name).toBe('Test Section');
    expect(hydrated.sections[0].fromHold).toBe('M1');
    expect(hydrated.sections[0].anchor).toEqual(shareable.sections[0].anchor);
    expect(hydrated.showArrow).toBe(true);
    expect(hydrated.displayOptions).toEqual(shareable.displayOptions);
  });
});

describe('roundtrip encoding/decoding', () => {
  it('should preserve data through encode/decode cycle', () => {
    const original: ShareableConfig = {
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        {
          name: 'Complex Section éàü',
          source: 'ifsc',
          lane: 0,
          fromHold: 1,
          toHold: 20,
          color: '#FF5500',
          anchor: { side: 'SN', column: 'F', row: 5 },
        },
        {
          name: 'Second Section',
          source: 'u15',
          lane: 1,
          fromHold: 'M1',
          toHold: 'M10',
          color: '#00FF00',
        },
      ],
      showArrow: true,
      displayOptions: {
        gridColor: '#AABBCC',
        labelFontSize: 35,
        holdLabelFontSize: 40,
      },
    };

    const encoded = encodeConfig(original);
    const decoded = decodeConfig(encoded);

    expect(decoded).toEqual(original);
  });
});

describe('getConfigFingerprint', () => {
  it('should generate same fingerprint for identical configs', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config 1',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's1', name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    const config2: SavedConfiguration = {
      id: 'id-2',
      name: 'Config 2 (different name)',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's2', name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
      createdAt: 3000,
      updatedAt: 4000,
    };

    expect(getConfigFingerprint(config1)).toBe(getConfigFingerprint(config2));
  });

  it('should generate different fingerprint for different wall configs', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      createdAt: 1000,
      updatedAt: 2000,
    };

    const config2: SavedConfiguration = {
      id: 'id-2',
      name: 'Config',
      wall: { lanes: 3, panelsHeight: 10 },
      sections: [],
      createdAt: 1000,
      updatedAt: 2000,
    };

    expect(getConfigFingerprint(config1)).not.toBe(getConfigFingerprint(config2));
  });

  it('should generate different fingerprint for different sections', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's1', name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    const config2: SavedConfiguration = {
      id: 'id-2',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's2', name: 'Section', source: 'u15', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    expect(getConfigFingerprint(config1)).not.toBe(getConfigFingerprint(config2));
  });

  it('should generate same fingerprint regardless of section order', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's1', name: 'Section A', source: 'ifsc', lane: 0, fromHold: 1, toHold: 10, color: '#FF0000' },
        { id: 's2', name: 'Section B', source: 'u15', lane: 1, fromHold: 1, toHold: 10, color: '#00FF00' },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    const config2: SavedConfiguration = {
      id: 'id-2',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { id: 's3', name: 'Section B', source: 'u15', lane: 1, fromHold: 1, toHold: 10, color: '#00FF00' },
        { id: 's4', name: 'Section A', source: 'ifsc', lane: 0, fromHold: 1, toHold: 10, color: '#FF0000' },
      ],
      createdAt: 1000,
      updatedAt: 2000,
    };

    expect(getConfigFingerprint(config1)).toBe(getConfigFingerprint(config2));
  });

  it('should ignore displayOptions in fingerprint', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      displayOptions: { gridColor: '#AAAAAA' },
      createdAt: 1000,
      updatedAt: 2000,
    };

    const Drawing: SavedConfiguration = {
      id: 'id-2',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      displayOptions: { gridColor: '#BBBBBB', labelFontSize: 50 },
      createdAt: 1000,
      updatedAt: 2000,
    };

    expect(getConfigFingerprint(config1)).toBe(getConfigFingerprint(Drawing));
  });

  it('should include showArrow in fingerprint', () => {
    const config1: SavedConfiguration = {
      id: 'id-1',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      showArrow: true,
      createdAt: 1000,
      updatedAt: 2000,
    };

    const config2: SavedConfiguration = {
      id: 'id-2',
      name: 'Config',
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [],
      showArrow: false,
      createdAt: 1000,
      updatedAt: 2000,
    };

    expect(getConfigFingerprint(config1)).not.toBe(getConfigFingerprint(config2));
  });

  it('should work with ShareableConfig type', () => {
    const shareable: ShareableConfig = {
      wall: { lanes: 2, panelsHeight: 10 },
      sections: [
        { name: 'Section', source: 'ifsc', lane: 0, fromHold: 1, toHold: 20, color: '#FF0000' },
      ],
    };

    const fingerprint = getConfigFingerprint(shareable);
    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(0);
  });
});
