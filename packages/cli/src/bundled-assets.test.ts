import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { HOLD_TYPES_CONFIG, HOLD_SVG_CONTENT } from '@voie-vitesse/core';

/**
 * packages/core/src/bundled-assets.ts is generated from assets/holds by
 * `bun run generate:assets`. Nothing else forces the two to agree, so an edit to
 * the source assets that is never regenerated would ship silently - and hold
 * colors and dimensions are read from that config at render time.
 *
 * This guard lives in the CLI package because core deliberately carries no node
 * types, being browser-compatible.
 */
const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'assets', 'holds');

describe('bundled assets', () => {
  it('should match assets/holds/holds.json exactly', () => {
    const source: unknown = JSON.parse(readFileSync(join(ASSETS_DIR, 'holds.json'), 'utf-8'));

    expect(HOLD_TYPES_CONFIG).toEqual(source);
  });

  it('should bundle one SVG per declared hold type', () => {
    const svgFiles = readdirSync(ASSETS_DIR)
      .filter((f: string) => f.endsWith('.svg'))
      .map((f: string) => f.replace('.svg', ''))
      .sort();

    expect(Object.keys(HOLD_SVG_CONTENT).sort()).toEqual(svgFiles);
    expect(Object.keys(HOLD_TYPES_CONFIG).sort()).toEqual(svgFiles);
  });

  it('should keep the finish pad dark in every route', () => {
    // Regression guard: this is what makes STOP holds ignore their route's colors
    expect(HOLD_TYPES_CONFIG.STOP.color).toBe('#1A1A1A');
  });
});
