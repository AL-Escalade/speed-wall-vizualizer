/**
 * Configuration validation using arktype
 */

import { type } from 'arktype';
import type { SavedConfiguration } from '@/store/types';

/** Anchor position schema */
const AnchorPositionSchema = type({
  side: "'SN' | 'DX'",
  column: 'string',
  row: 'number',
});

/** Section schema */
const SectionSchema = type({
  id: 'string',
  name: 'string',
  source: 'string',
  lane: 'number',
  fromHold: 'number | string',
  toHold: 'number | string',
  color: 'string',
  'anchor?': AnchorPositionSchema,
});

/** Wall config schema */
const WallConfigSchema = type({
  lanes: 'number',
  panelsHeight: 'number',
});

/** Saved configuration schema - timestamps optional for backward compatibility */
const ImportedConfigurationSchema = type({
  id: 'string',
  name: 'string',
  wall: WallConfigSchema,
  sections: SectionSchema.array(),
  'createdAt?': 'number',
  'updatedAt?': 'number',
});

type ImportedConfiguration = typeof ImportedConfigurationSchema.infer;

/**
 * Validate and parse a configuration object
 * @param data - Raw data to validate
 * @returns Validated configuration with normalized timestamps or error message
 */
export function validateConfiguration(data: unknown):
  | { success: true; data: SavedConfiguration }
  | { success: false; error: string } {
  const result = ImportedConfigurationSchema(data);

  // ArkErrors has a summary property, valid data doesn't
  if ('summary' in result && typeof result.summary === 'string') {
    return {
      success: false,
      error: result.summary,
    };
  }

  const validated = result as ImportedConfiguration;
  const now = Date.now();

  // Normalize: add timestamps if missing (backward compatibility)
  const normalized: SavedConfiguration = {
    ...validated,
    createdAt: validated.createdAt ?? now,
    updatedAt: validated.updatedAt ?? now,
  };

  return {
    success: true,
    data: normalized,
  };
}
