# Tasks: Add Multi-Color Routes

## Phase 1: Core Data Model

### 1.1 Add color types
- [x] Add `RouteColorMap` and `DEFAULT_COLOR_TAG` in `packages/core/src/types.ts`
- [x] Widen `ReferenceRoute.color` to `string | RouteColorMap`
- [x] Add `Hold.colorTag`, `SmearingZone.colorTag`, `RouteSegment.colors`
- [x] Add `HoldTypeConfig.color`
- [x] Export the new symbols from `packages/core/src/index.ts`
- **Validation**: Unit tests for the helpers below

### 1.2 Add color helpers
- [x] `getRouteColorMap()` normalizes a color string to `{ DEFAULT: color }`
- [x] `getDefaultColorTag()` returns the first declared key
- [x] `validateRouteColorTags()` reports undeclared tags and empty maps
- **Validation**: `route-composer.test.ts`

### 1.3 Update JSON schemas
- [x] `schemas/route.schema.json`: `color` as `oneOf`, `#COLORTAG` in the holds
      pattern, `colorTag` on smearing zones, tag names must start with a letter
- [x] `schemas/config.schema.json`: `colors` on `routeSegment`, `color` untouched
- **Validation**: existing route files still validate

## Phase 2: Route Composition

### 2.1 Parse the color tag
- [x] Accept 4 to 7 parts in `parseHold`, handle `#` before the numeric branch
- [x] Raise an explicit error for an empty tag
- **Validation**: tag alone, tag with label and scale in any order, untagged hold

### 2.2 Centralize color resolution
- [x] Single `resolveItemColor()` used by both `extractHolds` and
      `extractSmearingZones`, so the two sites cannot drift
- [x] Precedence: explicit tag, then hold type color, then segment, then route
- [x] Segment branches on the presence of `colors`, not its content
- **Validation**: all six branches, plus the two pre-existing color tests unchanged

### 2.3 Keep finish pads dark
- [x] `color` on the `STOP` type in `assets/holds/holds.json`
- [x] `getHoldTypeColor()` in `hold-svg-parser.ts`
- [x] Regenerate `packages/core/src/bundled-assets.ts`
- **Validation**: pads are dark in a single-color and a multi-color route

## Phase 3: Route Data

### 3.1 Fix the label extraction regex
- [x] `routesStore.ts`: `/@([\w-]+)$/` was end-anchored and would drop every
      tagged hold from the from/to dropdowns
- **Validation**: regression test asserting no label is lost on `u15-it`

### 3.2 Convert the German routes
- [x] `u15-it.json` and `u13-de.json`: `{ RED, DARKGREEN }`, tag `@G*` and `@I*`
- **Validation**: data-integrity test over all seven routes

### 3.3 Deduplicate the CLI parser
- [x] `packages/cli/src/reference-routes/index.ts` held an independent copy of
      `parseHold`; delegate to core while preserving its ABC default
- [x] Report color tag problems when loading a route file
- [x] Fix `--list-routes`, which printed a color map as `[object Object]`
- **Validation**: CLI tests, including a multi-color route loaded from disk

## Phase 4: Web Configuration

### 4.1 Migration
- [x] `constants/legacyRouteColors.ts`: frozen pre-feature colors
- [ ] `utils/sectionColors.ts`: `migrateSectionColors()`, `resolveSectionColors()`,
      `isSectionColorCustomized()` — **`decideMigratedColors()` still to implement**
- **Validation**: case-insensitivity, idempotence, unknown route

### 4.2 Section model and stores
- [x] `Section.colors` in `store/types.ts`
- [x] `getRouteColorMap()` in `routesStore`, `getRouteColor()` via the default tag
- [x] `setSectionColors()` / `resetSectionColors()` keep the `color` mirror in sync
- [x] Migration hook in `onRehydrateStorage`, without bumping `version`
- **Validation**: store tests

### 4.3 The other two entry points
- [x] `configValidation.ts`: optional `colors`, migrate inside `validateConfiguration`
- [x] `urlConfig.ts`: `colors` in `ShareableConfig`, additive validation, migration
      in `hydrateShareableConfig`, and `colors` added to `getConfigFingerprint`
- **Validation**: old payloads still accepted, fingerprints still match

### 4.4 Web to core mapping
- [x] `sectionToSegment()` emits exactly one of `colors` or `color`
- **Validation**: the three cases, existing tests unchanged

## Phase 5: User Interface

### 5.1 Color pickers
- [x] Optional `label` on `ColorPicker`
- [x] New `SectionColorPickers`: one picker per tag plus a reset control
- [x] Single-color routes keep the exact previous UI
- **Validation**: component tests

### 5.2 Section panel
- [x] Debounce generalized to a map with a single timer and a single state
- [x] `handleSourceChange` drops overrides, `handleAddSection` starts empty
- [x] `SectionHeader` swatch shows hard-stop bands for several colors
- **Validation**: component tests

### 5.3 Translations
- [x] `section.colorTag.RED`, `section.colorTag.DARKGREEN`, `section.resetColors`
      in fr, en, de, it
- **Validation**: labels render in the component tests

## Phase 6: Documentation

- [x] Hold format and hold colors in `CLAUDE.md`
- [x] Spec deltas for `svg-route-generator` and `web-app`
- [x] Regenerate `docs/images/*.svg` via `scripts/generate-doc-images.ts`
