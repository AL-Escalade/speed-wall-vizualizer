# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Speed Wall Visualizer - A tool for visualizing and configuring speed climbing walls. Generates SVG representations of hold placements according to reference routes (IFSC, U15, U11-U13 categories).

## Commands

```bash
# Install dependencies
npm install

# Build all packages (required before running)
npm run build

# Development
npm run dev:web          # Start web app dev server (Vite)
npm run test             # Run tests with Vitest
npm run test:coverage    # Run tests with coverage
npx vitest run <file>    # Run single test file

# Generate SVG via CLI
npm run generate -- -c data/base.json -o output/wall.svg
npm run generate:base    # Generate from base.json

# Lint (all packages with oxlint)
npm run lint

# Regenerate bundled assets (after modifying hold SVGs)
npm run generate:assets
```

## Architecture

### Monorepo Structure (npm workspaces)

- **`packages/core`** (`@voie-vitesse/core`): Core library with no UI dependencies
  - `types.ts` - Domain types (Panel, Hold, Route, Config)
  - `plate-grid.ts` - Wall grid calculations (insert positions, dimensions)
  - `route-composer.ts` - Composes routes from segments with filtering/anchoring
  - `svg-generator.ts` - Generates SVG output from composed holds
  - `hold-svg-parser.ts` - Parses hold SVG files and applies transformations
  - `bundled-assets.ts` - Pre-bundled SVG content for browser use

- **`packages/cli`** (`@voie-vitesse/cli`): Command-line interface
  - Uses core library to generate SVG/PDF/PNG from JSON configs

- **`packages/web`** (`@voie-vitesse/web`): React web application
  - **State**: Zustand stores in `src/store/`
    - `configStore.ts` - Wall configurations (persisted to localStorage)
    - `routesStore.ts` - Reference routes data
    - `viewerStore.ts` - UI state (zoom, pan, display options)
  - **Components**: `src/components/`
  - **Hooks**: `src/hooks/` (touch gestures, URL sync, exports)

### Data Flow

1. **Reference routes** (`data/routes/*.json`) define official hold positions
2. **User config** specifies wall dimensions and route segments with optional anchoring/filtering
3. **Route composer** extracts holds, applies offsets and filters
4. **SVG generator** renders holds with rotation, labels, and grid

### Hold Format

Holds use compact string format: `"PANEL TYPE POSITION ORIENTATION [@LABEL]"`
- Example: `"DX2 BIG F1 D3 @M1"` - BIG hold at F1 on DX2, pointing to D3, labeled M1
- Cross-panel orientation: `"SN5 FOOT H1 SN4:H10 @P6"` - orientation target on different panel

### Column Coordinate Systems

Three systems exist (letters differ after I):
- **ABC**: ABCDEFGHIJK (default internal)
- **FFME**: ABCDEFGHIKL (French federation)
- **IFSC**: ABCDEFGHILM (international)

Routes declare their system via `columns` field.

<!-- OPENSPEC:START -->
## OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

- Tous les changements liés à la configuration doivent pouvoir être rétro compatibles (ou on doit s'assurer de la migration) car des utilisateurs ont sur leur navigateur des configs dans leur localstorage, ils peuvent importer d'anciens fichiers exportés, ou peuvent suivre des liens qui contiennent une configuration.