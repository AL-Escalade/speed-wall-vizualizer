# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Speed Wall Visualizer - A tool for visualizing and configuring speed climbing walls. Generates SVG representations of hold placements according to reference routes (IFSC, U15, U11-U13 categories).

## Commands

```bash
# Install dependencies
bun install

# Build all packages (required before running)
bun run build

# Development
bun run dev:web          # Start web app dev server (Vite)
bun run test             # Run tests with Vitest
bun run test:coverage    # Run tests with coverage
bun run vitest run <file> # Run single test file

# Generate SVG via CLI
bun run generate -- -c data/base.json -o output/wall.svg
bun run generate:base    # Generate from base.json

# Lint (all packages with oxlint)
bun run lint

# Regenerate bundled assets (after modifying hold SVGs)
bun run generate:assets

# Regenerate README illustrations (after ANY change affecting the rendering)
bun run generate:doc-images
```

Any change that influences the final rendering - SVG generator, grid, hold
assets, or reference route data - must be accompanied by regenerated
`docs/images/*.svg`. Leaving them stale is worse than a noisy diff.

## Architecture

### Monorepo Structure (Bun workspaces)

- **`packages/core`** (`@voie-vitesse/core`): Core library with no UI dependencies
  - `types.ts` - Domain types (Panel, Hold, Route, Config)
  - `plate-grid.ts` - Wall grid calculations (insert positions, dimensions)
  - `route-composer.ts` - Composes routes from segments with filtering/anchoring
  - `svg-generator.ts` - Generates SVG output from composed holds
  - `hold-svg-parser.ts` - Parses hold SVG files and applies transformations
  - `rotation.ts` - Hold rotation angle calculations
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

Holds use compact string format: `"PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE] [#COLORTAG]"`
- Example: `"DX2 BIG F1 D3 @M1"` - BIG hold at F1 on DX2, pointing to D3, labeled M1
- Cross-panel orientation: `"SN5 FOOT H1 SN4:H10 @P6"` - orientation target on different panel
- Color tag: `"DX1 FOOT C3 C4 @G1 #DARKGREEN"` - hold painted with the route's DARKGREEN

The optional trailing tokens can appear in any order.

### Hold Colors

A route declares either a single color or a map whose **first key is the default**
applied to untagged holds:

```jsonc
"color": "#FF0000"                                     // all holds
"color": { "RED": "#FF0000", "DARKGREEN": "#006400" }  // per #COLORTAG
```

Resolution order: an explicit `#COLORTAG` wins, then a color forced by the hold
type (`STOP` pads are always dark, see `assets/holds/holds.json`), then the
route's default color.

A config segment overrides colors two ways, and the resolver switches on which
one is **present**, not on its content:
- `colors: { TAG: "#..." }` - per-tag; a tag with no entry follows the route.
  `colors: {}` therefore means "route colors, no override".
- `color: "#..."` - legacy uniform override, ignored when `colors` is present.

Undeclared tags fall back to the default color rather than throwing; use
`validateRouteColorTags()` to catch typos in route data.

### Column Coordinate Systems

Three systems exist (letters differ after I):
- **ABC**: ABCDEFGHIJK (default internal)
- **FFME**: ABCDEFGHIKL (French federation)
- **IFSC**: ABCDEFGHILM (international)

Routes declare their system via `columns` field.

## Code Style

- **ESM imports**: Use `.js` extension in all imports within `packages/core` and `packages/cli` (e.g., `from './types.js'`)
- **Naming**: camelCase functions/variables, PascalCase types/components, SCREAMING_SNAKE_CASE constants, kebab-case files (except React components: PascalCase)
- **Core package**: Pure functions, no classes. All functions are typed with explicit parameters.
- **Web package**: React 19 + Zustand stores + Tailwind v4/DaisyUI + react-intl (fr/en/de/it) + arktype for validation
- **Tests**: Vitest with `describe`/`it`/`expect`, co-located `*.test.ts` files. Web tests use jsdom.
- **Linting**: oxlint with type-aware mode (no formatter configured)

## Gotchas

- Build uses TypeScript 7 (stable) through the standard `tsc` binary
- Package manager is Bun — use `bun install`/`bun run`, not npm/npx
- Run `bun run build` before `bun run dev:web` — the web app depends on core's compiled output
- Config changes must be backward-compatible (or include migration) — users have configs in localStorage, may import old exported files, or follow URLs containing configurations. Anything that cannot be replayed idempotently (renaming a route id, reusing one for different data) goes through `packages/web/src/utils/configMigrations.ts`: bump `CONFIG_SCHEMA_VERSION`, describe the step there, and it applies at all three entry points
- When adding user-visible strings in the web app, add translations to all 4 locale files in `packages/web/src/i18n/`
- Web tests mock `window.matchMedia` and `ResizeObserver` in `packages/web/src/test/setup.ts`
