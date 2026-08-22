# Proposal: Add Multi-Color Routes

## Summary

Allow a reference route to declare several hold colors and tag each hold with one
of them, and let users override each color independently per section in the web
app. Also force finish pads to a dark color in every route.

## Motivation

Some routes mix holds of different provenance, which are physically different
colors on the wall. The German U15 route (`u15-it.json`) combines red holds
inherited from the IFSC route with dark green holds added for the German variant;
`u13-de.json` follows the same pattern. Until now `ReferenceRoute.color` was a
single string, so every hold of a section rendered in one color and the printed
plan did not match the real wall.

## Scope

### In Scope
- `ReferenceRoute.color` accepts either a hex string or a tag -> color map
- Optional `#COLORTAG` token in the compact hold string
- Optional `colorTag` on smearing zones
- Per-hold-type forced color, used to keep `STOP` pads dark in every route
- Per-tag color overrides on config segments (`RouteSegment.colors`)
- One color picker per declared color in the web app, plus a reset control
- Migration of sections saved before this change, at all three entry points
- Update `u15-it.json` and `u13-de.json` to red + dark green

### Out of Scope
- Per-hold color literals in user configurations (tags reference route colors only)
- Converting `u15.json` and `training.json`, which are also mixed-provenance but
  stay single-color for now
- Naming color tags per route (tag names are shared across routes and translated
  by convention)

## Backward Compatibility

1. **Reference routes**: `color` as a plain string keeps its exact meaning; it is
   normalized internally to `{ DEFAULT: color }`.
2. **Hold strings**: the `#COLORTAG` token is optional and appended, so every
   existing hold string parses unchanged.
3. **CLI configs**: a segment carrying only `color` still applies it uniformly.
   `data/base.json` and `data/project.json` render identically apart from pads.
4. **localStorage**: `migrateSectionColors()` runs on rehydration and is
   idempotent, so no `version` bump is needed. Bumping it without a `migrate`
   function would make zustand discard every saved configuration.
5. **JSON imports and shared links**: `colors` is optional and additive; payloads
   without it validate and are migrated on the way in.
6. **Exports**: `Section.color` stays required and is kept in sync with the
   default tag, so a new export opened by an older build still renders.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Color declaration | `string \| Record<tag, color>` | Keeps the existing form valid with no migration of route data |
| Default color | First key of the map | No extra field to declare; matches reading order |
| Tag name constraint | Must start with a letter | `Object.keys()` hoists integer-like keys, which would silently steal the default |
| Tag location | Token in the hold string | Consistent with the existing `@LABEL` and scale tokens; keeps the hold list the single source of truth |
| Reserved tag | `DEFAULT` | Serializes into share URLs, and is harmless if a route ever declares it for real |
| Unknown tag | Falls back to the default color | A mis-colored hold beats a plan that fails to render; `validateRouteColorTags()` catches typos in tests and the CLI |
| Pad color | Per-hold-type color on `STOP` | Applies to every route without forcing single-color routes to declare a map |
| Segment override mode | Switches on the *presence* of `colors` | A merged rule would let a stale uniform `color` bleed into tags a partial map does not cover |
| "No override" state | `colors: {}` | Doubles as the migrated marker, which is what makes the migration idempotent |
| Un-customized sections | Store `{}`, not the route's values | Materializing would freeze route data into user state, so later corrections would never reach existing users |
| Legacy color detection | Frozen snapshot, compared case-insensitively | `<input type="color">` emits lowercase, so strict equality would misread a re-picked identical color as customized |

## Spec Deltas

- `specs/svg-route-generator/spec.md`: Multi-color route data model, color tag
  resolution, and hold-type forced colors
- `specs/web-app/spec.md`: Per-tag color customization and section migration

## Related

- svg-route-generator spec: Hold Coloring requirement
- web-app spec: Section Color Customization requirement
