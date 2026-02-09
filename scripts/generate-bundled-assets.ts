#!/usr/bin/env npx tsx
/**
 * Script to generate bundled-assets.ts from assets/holds/ directory
 * This ensures a single source of truth for hold SVGs and configuration
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSETS_DIR = join(__dirname, '../assets/holds');
const OUTPUT_FILE = join(__dirname, '../packages/core/src/bundled-assets.ts');

interface HoldTypeConfig {
  description: string;
  dimensions: { width: number; height: number };
  defaultOrientation: number;
  showArrow?: boolean;
}

function main() {
  // Read holds.json configuration
  const holdsConfigPath = join(ASSETS_DIR, 'holds.json');
  const holdsConfig: Record<string, HoldTypeConfig> = JSON.parse(
    readFileSync(holdsConfigPath, 'utf-8')
  );

  // Read all SVG files
  const svgFiles = readdirSync(ASSETS_DIR).filter(f => f.endsWith('.svg'));
  const svgContent: Record<string, string> = {};

  for (const file of svgFiles) {
    const holdType = file.replace('.svg', '').toUpperCase();
    const content = readFileSync(join(ASSETS_DIR, file), 'utf-8');
    svgContent[holdType] = content;
  }

  // Generate TypeScript file
  const output = `/**
 * Bundled hold assets for browser compatibility
 * AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Run: npm run generate:assets
 * Source: assets/holds/
 */

import type { HoldTypesConfig } from './types.js';

/** Hold SVG content by type */
export const HOLD_SVG_CONTENT: Record<string, string> = {
${Object.entries(svgContent)
  .map(([type, content]) => `  '${type}': \`${content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``)
  .join(',\n')}
};

/** Hold types configuration */
export const HOLD_TYPES_CONFIG: HoldTypesConfig = ${JSON.stringify(holdsConfig, null, 2)};

/** Get list of available hold types */
export function getAvailableHoldTypes(): string[] {
  return Object.keys(HOLD_TYPES_CONFIG);
}
`;

  writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`  - ${Object.keys(svgContent).length} SVG files bundled`);
  console.log(`  - ${Object.keys(holdsConfig).length} hold types configured`);
}

main();
