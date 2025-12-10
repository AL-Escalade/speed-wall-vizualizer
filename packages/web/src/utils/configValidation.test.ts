import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConfiguration } from './configValidation';
import type { SavedConfiguration } from '@/store';

describe('validateConfiguration', () => {
  const validConfig: SavedConfiguration = {
    id: 'test-id',
    name: 'Test Config',
    wall: {
      lanes: 2,
      panelsHeight: 10,
    },
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
    createdAt: 1000,
    updatedAt: 2000,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should validate a correct configuration', () => {
    const result = validateConfiguration(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('test-id');
      expect(result.data.name).toBe('Test Config');
      expect(result.data.wall).toEqual({ lanes: 2, panelsHeight: 10 });
      expect(result.data.sections).toHaveLength(1);
    }
  });

  it('should reject non-object data', () => {
    const result = validateConfiguration(null);
    expect(result.success).toBe(false);

    const result2 = validateConfiguration('string');
    expect(result2.success).toBe(false);
  });

  it('should reject config without id', () => {
    const { id: _, ...configWithoutId } = validConfig;
    const result = validateConfiguration(configWithoutId);
    expect(result.success).toBe(false);
  });

  it('should reject config without name', () => {
    const { name: _, ...configWithoutName } = validConfig;
    const result = validateConfiguration(configWithoutName);
    expect(result.success).toBe(false);
  });

  it('should reject config without wall', () => {
    const { wall: _, ...configWithoutWall } = validConfig;
    const result = validateConfiguration(configWithoutWall);
    expect(result.success).toBe(false);
  });

  it('should reject config with invalid wall', () => {
    const configWithInvalidWall: unknown = {
      ...validConfig,
      wall: { lanes: 'two' }, // Invalid: lanes should be number
    };
    const result = validateConfiguration(configWithInvalidWall);
    expect(result.success).toBe(false);
  });

  it('should reject config without sections', () => {
    const { sections: _, ...configWithoutSections } = validConfig;
    const result = validateConfiguration(configWithoutSections);
    expect(result.success).toBe(false);
  });

  it('should reject config with invalid section', () => {
    const configWithInvalidSection: unknown = {
      ...validConfig,
      sections: [
        { id: 'section-1', name: 'Test' }, // Invalid: missing required fields
      ],
    };
    const result = validateConfiguration(configWithInvalidSection);
    expect(result.success).toBe(false);
  });

  it('should allow config without timestamps and add current time', () => {
    const { createdAt: _, updatedAt: __, ...configWithoutTimestamps } = validConfig;
    const result = validateConfiguration(configWithoutTimestamps);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBe(Date.now());
      expect(result.data.updatedAt).toBe(Date.now());
    }
  });

  it('should preserve existing timestamps', () => {
    const result = validateConfiguration(validConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBe(1000);
      expect(result.data.updatedAt).toBe(2000);
    }
  });

  it('should validate config with anchor', () => {
    const configWithAnchor = {
      ...validConfig,
      sections: [
        {
          ...validConfig.sections[0],
          anchor: {
            side: 'SN',
            column: 'F',
            row: 5,
          },
        },
      ],
    };

    const result = validateConfiguration(configWithAnchor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections[0].anchor).toEqual({ side: 'SN', column: 'F', row: 5 });
    }
  });

  it('should reject invalid anchor side', () => {
    const configWithInvalidAnchor: unknown = {
      ...validConfig,
      sections: [
        {
          ...validConfig.sections[0],
          anchor: {
            side: 'INVALID', // Invalid: should be 'SN' or 'DX'
            column: 'F',
            row: 5,
          },
        },
      ],
    };

    const result = validateConfiguration(configWithInvalidAnchor);
    expect(result.success).toBe(false);
  });

  it('should accept string fromHold and toHold (labels)', () => {
    const configWithLabels = {
      ...validConfig,
      sections: [
        {
          ...validConfig.sections[0],
          fromHold: 'M1',
          toHold: 'M10',
        },
      ],
    };

    const result = validateConfiguration(configWithLabels);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections[0].fromHold).toBe('M1');
      expect(result.data.sections[0].toHold).toBe('M10');
    }
  });
});
