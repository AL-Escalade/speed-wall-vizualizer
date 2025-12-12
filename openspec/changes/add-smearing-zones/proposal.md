# Proposal: Add Smearing Zones

## Summary

Add support for displaying smearing zones (zones d'adhérence) on the climbing wall visualization. These are rectangular areas where climbers can use friction-based foot placements on the wall surface itself.

## Motivation

Speed climbing routes include designated smearing zones where athletes can place their feet using friction against the wall surface, rather than on holds. These zones need to be visualized on the wall plan to help climbers and route setters understand the full route layout.

## Scope

### In Scope
- Define smearing zones in reference route JSON files (ifsc.json, u15.json, etc.)
- Render smearing zones as rectangles with hatched pattern in the SVG
- Display zone labels positioned at bottom-left of each rectangle
- Add toggle to show/hide smearing zones in the web app (default: visible)
- Apply anchor offset to smearing zones when segments use repositioning
- Filter smearing zones based on vertical overlap with selected holds
- Maintain full backward compatibility with existing configurations

### Out of Scope
- Custom smearing zones per user configuration (zones come from reference routes only)
- Per-zone visibility toggles (only global toggle)
- Smearing zone editing in the web app

## Backward Compatibility

This change is fully backward compatible:

1. **User configuration schema unchanged**: Smearing zones are defined only in reference routes, not in user configurations. No migration required.
2. **localStorage configs**: Existing saved configurations continue to work. They will automatically display zones when reference routes are updated.
3. **URL-shared configs**: Old shared URLs remain valid and functional.
4. **JSON imports**: Previously exported JSON files can still be imported without modification.
5. **Reference routes without zones**: Routes that don't define `smearingZones` default to an empty array with no error.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Zone definition location | Reference routes (ifsc.json, etc.) | Zones are part of official route specifications, not user customization |
| Position format | Insert coordinates (panel, column, row) for bottom-left corner | Consistent with hold positioning system |
| Size format | Width/height in insert units (float) | Intuitive for route setters, allows fractional sizes |
| Hatching style | Diagonal lines (45°) | Classic visual pattern for zones |
| Opacity | 50% | Good visibility while keeping grid visible |
| Label position | Bottom-left, text left-aligned with rectangle edge | Clear zone identification |
| Label font size | Same as hold labels (40px) | Visual consistency |
| Z-order | Below holds | Zones are background elements |
| Toggle scope | Global for all zones | Simple UX, zones are usually all-or-nothing |
| Filtering | Vertical overlap with selected holds | Zone included if it starts before the highest selected hold AND ends after the lowest selected hold |
| Anchor behavior | Zones move with anchor offset | Zones are part of the route, should follow repositioning |

## Spec Deltas

- `specs/svg-route-generator/spec.md`: Add smearing zone data model and rendering requirements
- `specs/web-app/spec.md`: Add smearing zone visibility toggle requirement

## Related

- svg-route-generator spec: Hold rendering and positioning
- web-app spec: Display options and viewer functionality
