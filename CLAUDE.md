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

### Hold Labels

A label prefix is **presentation, not data**: it encodes a semantic role, and each
route file writes it in its own federation's convention.

| Prefix written in route data | Role |
|---|---|
| `M`, `H` | `HAND` |
| `P`, `F` | `FOOT` |
| `N`, `I` | `ADDED_HAND` |
| `Q`, `G`, `R` | `ADDED_FOOT` |
| `PAD` | `PAD` |

| Role | fr | en | de | it |
|---|---|---|---|---|
| `HAND` | M | H | H | M |
| `FOOT` | P | F | F | P |
| `ADDED_HAND` | N | I | I | N |
| `ADDED_FOOT` | Q | G | G | Q |
| `PAD` | PAD | PAD | PAD | PAD |

`formatHoldLabel(label, language)` (`packages/core/src/hold-label.ts`) swaps the
prefix and keeps the numeric index verbatim (`M12` → `H12`). Prefixes of every
language are table entries, so an already-translated label re-translates
(`H1` → `M1` in fr) — that is what uniformises the DE/IT/IN routes. An unknown
prefix renders verbatim rather than throwing: a mislabelled plan must stay
readable, and the reference-route test is what flags the typo.

Smearing zone labels are translated the same way, through a **separate table**
in `packages/core/src/smearing-zone-label.ts`: `A` in the French and Italian
plans (Adhérence, Aderenza), `R` in the German ones (Reibung), `S` in English
(smearing, the one prefix no official plan backs). Never merge the two tables —
`R` means `ADDED_FOOT` on a hold and a zone on a zone; they coexist only because
the namespaces do not meet.

The language comes from `SvgOptions.holdLabelLanguage` (default `'fr'`), fed by
`useHoldLabelLanguage()` in the web app and by `--lang <fr|en|de|it>` in the CLI
(default `fr`, which keeps `docs/images/*.svg` in the project's language). It
governs hold and zone labels; coordinate labels (A-L, 1-10) are never translated.

`@PAD-U15` in `training.json` and `u15.json` is a bare identifier, not a prefix
plus an index: it fails the pattern, renders verbatim in all four languages, and
is allowlisted in the reference-route test.

**Raw value = identity, displayed text = translation.** The label written in
route data is the identity stored by `fromHold`, `toHold` and `excludeHolds`;
translate only the text shown to the user, never a form value or stored state.
That is what keeps a config shared by URL pointing at the same holds across
languages. Route data and `schemas/route.schema.json` are unchanged by this, and
no config migration is involved.

### Hold Label Placement

Hold labels are placed by `packages/core/src/label-placement.ts`, not drawn at a
fixed spot. Each label starts from its hold's **insert** and is pushed outward
until its box (text width estimated at 0.65 em per character, plus a 0.15 em
margin) clears its own hold outline — a hard guarantee — then the other holds,
the outside of the wall (see below), and, when `HoldLabelContext.inserts` is
given, any candidate nearer another hold's insert than its own. Zone labels are
**not** obstacles for hold labels — they are placed afterward and move out of
the way instead:

1. along the **ray** from the insert toward the asset's Inkscape anchor;
2. if the ray is blocked for `2 × fontSize` past lift-off, along a **fan** of
   directions around it (±22.5°, ±45°, … 180°);
3. otherwise at the first position within 5 % of the least overlap, preferring
   a position that still satisfies the association rule when one exists.

**Association rule**: a candidate is free only if its centre is strictly closer
to its own hold's insert than to the insert of every other hold — two holds
sharing an insert (within 1 mm) never block each other. `layoutLabels()`/
`generateSvg()` always pass every hold's insert, so the rule is always
enforced there; `placeHoldLabels()` called without a `context` (e.g. existing
unit tests) keeps its old, unassociated behavior.

**Wall edge**: the coordinate margin around the wall carries the column/row
letters, so both hold and zone labels must stay inside the wall rectangle
`[0, width] × [0, height]`, except in fallback: there, the frame is only one
obstacle among others, weighed by overlap area like any other, and the
association-rule preference for a candidate near its own hold can still win
even when it crosses the frame (measured: at 200 px, 3 fallbacks across the
reference plans, and all 3 still landed inside the wall).
`wallFrame(wall: Dimensions)` builds four
rectangles framing the wall, thick enough (`width + height`) to catch any
label box; these four polygons join the obstacle list of every label exactly
like other obstacles, so the same inflated-box margin (`LABEL_MARGIN_EM ×
fontSize`) keeps labels clear of the edge. `HoldLabelContext.wall` and
`ZoneLabelContext.wall` are optional — absent, there is no frame, so existing
callers and unit tests that build synthetic scenarios are unaffected;
`computeLayout()` (`svg-generator.ts`) always passes the wall dimensions to
both.

Labels are placed top of the wall first, so the result does not depend on the
order of the sections. `layoutHoldLabels()` returns the placements (direction,
distance, fallback, overlaps) for tests and debugging; `layoutLabels()` returns
both hold and zone-label placements.

In a hold asset, a `label-up|down|left|right` (or `label`) zone is a
**direction and an angle**, not a position: its tspan x/y is the text centre and
`text-anchor: middle` is required (`parseHoldSvg` throws otherwise); the
`<text>` transform gives the text angle; font size, baseline and style are
ignored. The hold outline is the first subpath of the `prise` path (or the
`pad` rect for STOP); path commands outside `M L H V C S Z` and transforms
outside `matrix translate rotate scale` throw.

**Smearing zone labels** are placed too, by `placeZoneLabels()`, *after* hold
labels: a candidate starts left-aligned under the zone's bottom edge and slides
right in 5 mm steps; if the whole edge is blocked it drops 5 mm and slides
again, up to `2 × fontSize` below the start. Obstacles are hold outlines, zone
labels already placed and the hold-label boxes just placed
(`ZoneLabelContext.fixedLabels`, not inflated, rotated as rendered) — zone
rectangles themselves are never obstacles. The zone rectangle geometry
(`computeZoneRect` in `svg-generator.ts`) is computed once and shared by
rendering and placement. A zone label has one band of candidate positions
where a hold label has 16, so the zone label is the one that adapts: a hold
label keeps the exact spot it would have with no zones on the wall at all.

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
