# Tasks: Add Smearing Zones

## Phase 1: Core Data Model

### 1.1 Add TypeScript types for smearing zones
- Add `SmearingZone` interface in `packages/core/src/types.ts`
- Add `ComposedSmearingZone` interface with anchor offset and lane offset
- Update `ReferenceRoute` interface to include optional `smearingZones` array
- **Validation**: Unit tests for type definitions

### 1.2 Update JSON schema
- Add `smearingZones` array definition in `schemas/config.schema.json` (for reference routes schema if separate) or document the format
- **Validation**: Schema validation passes with sample smearing zone data

## Phase 2: Route Composition

### 2.1 Parse smearing zones from reference routes
- Update route loading in `packages/core/src/route-composer.ts`
- Parse `smearingZones` array, default to empty if not present
- **Validation**: Unit test parsing with and without zones

### 2.2 Implement zone filtering logic
- Add function to filter zones by vertical overlap with holds
- Calculate hold Y range (min/max)
- Include zone if `zoneBaseY <= maxHoldY AND zoneTopY >= minHoldY`
- **Validation**: Unit tests for filtering edge cases

### 2.3 Apply anchor offset and lane offset to zones
- Apply same offset logic as holds
- Handle zones that span multiple panels
- **Validation**: Unit tests for offset application

### 2.4 Compose smearing zones in route composition
- Integrate zone parsing, filtering, and offset in `composeRoute` function
- Return composed zones alongside composed holds
- **Validation**: Integration test with full route composition

## Phase 3: SVG Generation

### 3.1 Generate hatched pattern definitions
- Create unique pattern ID per color
- Generate diagonal line pattern at 45 degrees
- Add patterns to SVG `<defs>` section
- **Validation**: Visual verification of pattern rendering

### 3.2 Render zone rectangles
- Calculate zone position in mm then convert to SVG coordinates
- Render solid fill rectangle with 50% opacity
- Render hatched pattern overlay rectangle
- **Validation**: Unit test SVG output structure

### 3.3 Render zone labels
- Position label at bottom-left of rectangle
- Apply zone color and 40px font size
- Use left alignment (text-anchor="start")
- **Validation**: Visual verification of label positioning

### 3.4 Add `showSmearingZones` option
- Add option to `SvgOptions` interface (default: true)
- Conditionally render zones based on option
- **Validation**: Unit test option behavior

### 3.5 Integrate zones into SVG generation
- Add zones layer after grid, before arrows
- Pass composed zones to `generateSvg` function
- **Validation**: Full SVG generation with zones

## Phase 4: Web App Integration

### 4.1 Add smearing zone state to viewer store
- Add `showSmearingZones: boolean` to `viewerStore.ts`
- Initialize to `true` (default visible)
- Add setter action
- **Validation**: Unit test store state management

### 4.2 Add toggle in display options
- Add checkbox "Zones d'adhérence" in display options component
- Wire to viewer store state
- **Validation**: Manual UI testing

### 4.3 Pass option to SVG generator
- Read `showSmearingZones` from store
- Pass to `generateSvg` options
- **Validation**: Toggle updates viewer in real-time

## Phase 5: Data & Documentation

### 5.1 Add sample smearing zones to reference routes
- Add example zones to `data/ifsc.json` or test data
- Document zone format in route JSON
- **Validation**: Zones render correctly in app

### 5.2 Update type exports
- Export new types from `packages/core/src/index.ts`
- **Validation**: Types accessible from consuming packages

## Phase 6: Backward Compatibility Testing

### 6.1 Test existing configurations without smearing zones
- Test loading configuration from localStorage (created before this feature)
- Verify no errors when reference route lacks `smearingZones` field
- **Validation**: Unit test with mock localStorage data

### 6.2 Test URL-shared configurations
- Test loading configuration from URL query parameter
- Verify old shared URLs continue to work
- **Validation**: Unit test URL parsing with legacy config format

### 6.3 Test JSON import of legacy configurations
- Test importing JSON files exported before this feature
- Verify config loads without requiring smearing zones
- **Validation**: Unit test with legacy JSON fixtures

### 6.4 Test reference route updates
- Test that existing configs automatically show zones when reference routes are updated
- Verify zones respect segment's anchor offset and lane offset
- **Validation**: Integration test with updated reference route

### 6.5 Verify user config schema unchanged
- Ensure `config.schema.json` does not require smearing zones in user configs
- Verify existing validation passes for legacy configs
- **Validation**: Schema validation with legacy config samples

## Dependencies

```
1.1 → 1.2 → 2.1 → 2.2, 2.3 → 2.4 → 3.1, 3.2, 3.3, 3.4 → 3.5 → 4.3 → 5.1, 5.2
                                                           ↑
4.1 → 4.2 ─────────────────────────────────────────────────┘

Phase 6 (backward compatibility tests) can run in parallel throughout:
- 6.1, 6.2, 6.3, 6.5 can start after 2.1 (parsing logic)
- 6.4 requires 2.4 (full composition with offset)
```

Tasks 3.1-3.4 can be worked in parallel after 2.4 is complete.
Tasks 4.1-4.2 can be worked in parallel with Phase 3.
Phase 5 can begin once Phase 3 is complete.
Phase 6 tests should be written alongside implementation to ensure backward compatibility.
