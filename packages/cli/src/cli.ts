#!/usr/bin/env node
/**
 * CLI for generating speed climbing wall visualizations
 *
 * Usage:
 *   tsx src/cli.ts --config wall-config.json
 *   tsx src/cli.ts --config wall-config.json --output wall.svg
 *   tsx src/cli.ts --config wall-config.json --output wall.png --format png
 */

import { readFile } from 'fs/promises';
import { resolve, basename, dirname, join } from 'path';
import type { Config, OutputFormat } from '@voie-vitesse/core';
import { generateSvg, composeAllRoutes } from '@voie-vitesse/core';
import { writeOutput, formatFromPath, getExtension } from './output/index.js';
import { getAvailableRouteNames, getReferenceRoute, loadRoutes } from './reference-routes/index.js';

/** CLI arguments */
interface CliArgs {
  config: string;
  output?: string;
  format?: OutputFormat;
  help?: boolean;
  listRoutes?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    config: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--config':
      case '-c':
        result.config = next || '';
        i++;
        break;
      case '--output':
      case '-o':
        result.output = next || '';
        i++;
        break;
      case '--format':
      case '-f':
        result.format = (next?.toLowerCase() || 'svg') as OutputFormat;
        i++;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--list-routes':
      case '-l':
        result.listRoutes = true;
        break;
    }
  }

  return result;
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Usage: tsx src/cli.ts [options]

Options:
  -c, --config <file>   Configuration file (JSON)
  -o, --output <file>   Output file (default: wall.svg)
  -f, --format <fmt>    Output format: svg, png, pdf (default: svg)
  -l, --list-routes     List available reference routes
  -h, --help            Show this help message

Configuration file format:
{
  "wall": {
    "lanes": 2,
    "panelsHeight": 10
  },
  "routes": [
    {
      "lane": "SN",
      "segments": [
        { "source": "ifsc", "fromHold": 1, "toHold": 20 }
      ]
    }
  ]
}

Route files are loaded from: data/routes/*.json
`);
}

/**
 * List available routes
 */
function listRoutes(): void {
  const routeNames = getAvailableRouteNames();

  if (routeNames.length === 0) {
    console.log('No routes found in data/routes/');
    return;
  }

  console.log('Available reference routes:\n');

  for (const name of routeNames) {
    const route = getReferenceRoute(name);
    if (route) {
      const holdCount = route.holds.length;
      console.log(`  ${name}`);
      console.log(`    Holds: ${holdCount}`);
      console.log(`    Color: ${route.color}`);
      console.log('');
    }
  }
}

/**
 * Load and validate configuration file
 */
async function loadConfig(configPath: string): Promise<Config> {
  const absolutePath = resolve(configPath);
  const content = await readFile(absolutePath, 'utf-8');
  const config = JSON.parse(content) as Config;

  // Validate required fields
  if (!config.wall) {
    throw new Error('Configuration missing "wall" section');
  }
  if (!config.routes || !Array.isArray(config.routes)) {
    throw new Error('Configuration missing "routes" array');
  }

  // Set defaults
  config.wall.lanes = config.wall.lanes ?? 2;
  config.wall.panelsHeight = config.wall.panelsHeight ?? 10;

  return config;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.listRoutes) {
    listRoutes();
    process.exit(0);
  }

  if (!args.config) {
    printUsage();
    process.exit(1);
  }

  try {
    console.log(`Loading configuration from: ${args.config}`);
    const config = await loadConfig(args.config);

    console.log(`Wall: ${config.wall.lanes} lanes × ${config.wall.panelsHeight} panels`);
    console.log(`Routes: ${config.routes.length}`);

    // Compose routes
    console.log('Composing routes...');
    const referenceRoutes = loadRoutes();
    const allHolds = composeAllRoutes(config.routes, referenceRoutes);
    console.log(`Total holds: ${allHolds.length}`);

    // Generate SVG
    console.log('Generating SVG...');
    const svgContent = await generateSvg(config, allHolds);

    // Determine output path and format
    let outputPath = args.output;
    let format = args.format;

    if (!outputPath) {
      const configName = basename(args.config, '.json');
      outputPath = join(dirname(args.config), `${configName}-output.svg`);
    }

    if (!format) {
      format = formatFromPath(outputPath) ?? 'svg';
    }

    // Ensure correct extension
    if (!outputPath.endsWith(`.${format}`)) {
      outputPath = outputPath.replace(/\.[^.]+$/, '') + `.${getExtension(format)}`;
    }

    // Write output
    console.log(`Writing ${format!.toUpperCase()} to: ${outputPath}`);
    await writeOutput(svgContent, outputPath, format!);

    console.log('Done!');
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
