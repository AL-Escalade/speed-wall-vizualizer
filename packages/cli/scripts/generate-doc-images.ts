/**
 * Regenerate the illustrations embedded in README.md.
 *
 * The plain route plans could come straight from the CLI, but arrows-demo.svg
 * needs options the CLI does not expose (orientation arrows) plus a crop, so
 * they all live here rather than being reproduced by hand.
 *
 * Lives in packages/cli because that is where the @voie-vitesse/core workspace
 * link resolves.
 *
 * Usage: bun run generate:doc-images
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { type Config, generateSvg, composeAllRoutes, composeAllSmearingZones } from '@voie-vitesse/core';
import { loadRoutes } from '../src/reference-routes/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const IMAGES_DIR = join(ROOT, 'docs', 'images');

/**
 * Plans rendered with default options, one per CLI config in data/.
 * Must cover every image README.md embeds; main() checks that and warns.
 */
const PLAIN_PLANS = [
  'base',
  'ifsc',
  'u11-u13-comp',
  'u11-u13-de',
  'u11-u13-it',
  'u11-u13-training',
  'u12-u14-comp',
  'u12-u14-training',
  'u13-de',
  'u13-u15-in',
  'u15',
  'u15-de',
  'u15-it',
];

/** Crop applied to arrows-demo.svg: bottom 3000mm of the left lane */
const ARROWS_DEMO_VIEWBOX = '-80 12000 3160 3000';

async function render(configName: string, showArrow: boolean): Promise<string> {
  const config = JSON.parse(
    readFileSync(join(ROOT, 'data', `${configName}.json`), 'utf-8')
  ) as Config;

  const routes = loadRoutes();
  const holds = composeAllRoutes(config.routes, routes);
  // Same pipeline as the CLI, so the illustrations cannot drift from its output
  const zones = composeAllSmearingZones(config.routes, routes, holds);

  return generateSvg(config, holds, showArrow ? { showArrow: true } : {}, zones);
}

async function main(): Promise<void> {
  // Catch a route added to README.md but never wired up here
  const embedded = [...readFileSync(join(ROOT, 'README.md'), 'utf-8')
    .matchAll(/docs\/images\/([\w-]+)\.svg/g)].map((m) => m[1]);
  const missing = embedded.filter((n) => n !== 'arrows-demo' && !PLAIN_PLANS.includes(n));
  if (missing.length > 0) {
    console.warn(`WARNING: README embeds images this script does not generate: ${missing.join(', ')}`);
  }

  const plans = await Promise.all(PLAIN_PLANS.map((name) => render(name, false)));
  PLAIN_PLANS.forEach((name, i) => {
    writeFileSync(join(IMAGES_DIR, `${name}.svg`), plans[i]);
    console.log(`Generated docs/images/${name}.svg`);
  });

  const demo = await render('base', true);
  const cropped = demo
    .replace(/viewBox="[^"]*"/, `viewBox="${ARROWS_DEMO_VIEWBOX}"`)
    .replace(/width="[^"]*"/, 'width="3160mm"')
    .replace(/height="[^"]*"/, 'height="3000mm"');
  writeFileSync(join(IMAGES_DIR, 'arrows-demo.svg'), cropped);
  console.log('Generated docs/images/arrows-demo.svg');
}

void main();
