# Design: Smearing Zones

## Overview

This document describes the technical design for implementing smearing zones in the speed wall visualizer.

## Data Model

### Smearing Zone Definition (in reference route JSON)

```json
{
  "color": "#0000FF",
  "holds": ["..."],
  "smearingZones": [
    {
      "label": "Z1",
      "panel": "DX1",
      "column": "E",
      "row": 3,
      "width": 2.5,
      "height": 4.0
    }
  ]
}
```

**Fields:**
- `label`: Zone identifier displayed on the plan (e.g., "Z1", "Zone A")
- `panel`: Panel identifier where the zone starts (e.g., "DX1", "SN3")
- `column`: Column letter for the bottom-left corner (A-L)
- `row`: Row number for the bottom-left corner (1-10)
- `width`: Width in insert units (float, e.g., 2.5 = 2.5 column spacings)
- `height`: Height in insert units (float, e.g., 4.0 = 4 row spacings, can span panels)

### Composed Smearing Zone (internal)

After route composition, each zone includes:
- All original fields
- `color`: Inherited from reference route (or segment override)
- `anchorOffset`: Applied offset from segment anchor (if any)
- `laneOffset`: Horizontal lane offset from segment

## Position Calculation

1. **Base position**: Convert (panel, column, row) to absolute mm coordinates using existing `getInsertPosition()` logic
2. **Dimensions**: Convert width/height from insert units to mm:
   - `widthMm = width * GRID.COLUMN_SPACING` (125mm per column)
   - `heightMm = height * GRID.ROW_SPACING` (125mm per row)
3. **Anchor offset**: Add `anchorOffset.x` and `anchorOffset.y` if present
4. **Lane offset**: Already handled by panel position

## SVG Rendering

### Hatched Pattern Definition

```svg
<defs>
  <pattern id="smearing-hatch-{color}" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="20" stroke="{color}" stroke-width="3" />
  </pattern>
</defs>
```

Each unique color requires its own pattern definition.

### Zone Rectangle

```svg
<g class="smearing-zone" data-label="{label}">
  <rect x="{x}" y="{y}" width="{width}" height="{height}"
        fill="{color}" fill-opacity="0.5" />
  <rect x="{x}" y="{y}" width="{width}" height="{height}"
        fill="url(#smearing-hatch-{color})" />
  <text x="{x}" y="{y + height}"
        font-size="40" fill="{color}"
        text-anchor="start" dominant-baseline="text-after-edge">
    {label}
  </text>
</g>
```

### Z-Order

SVG layers (bottom to top):
1. Background
2. Grid
3. **Smearing zones** (new)
4. Arrow indicators
5. Holds
6. Hold labels

## Filtering Logic

When a segment uses `fromHold`/`toHold`, zones are filtered by vertical overlap:

```typescript
function shouldIncludeZone(zone: SmearingZone, selectedHolds: Hold[]): boolean {
  // Get Y range of selected holds
  const holdYPositions = selectedHolds.map(h => getInsertPosition(h.panel, h.position).y);
  const minHoldY = Math.min(...holdYPositions);
  const maxHoldY = Math.max(...holdYPositions);

  // Get Y range of zone
  const zoneBaseY = getInsertPosition(zone.panel, { column: zone.column, row: zone.row }).y;
  const zoneTopY = zoneBaseY + zone.height * GRID.ROW_SPACING;

  // Zone overlaps if it starts before highest hold AND ends after lowest hold
  return zoneBaseY <= maxHoldY && zoneTopY >= minHoldY;
}
```

## Web App Integration

### SvgOptions Extension

```typescript
interface SvgOptions {
  // ... existing options
  showSmearingZones?: boolean;  // default: true
}
```

### UI Component

Add toggle in `DisplayOptions` component (existing display options section):
- Label: "Zones d'adhérence"
- Type: Checkbox
- Default: checked
- Stored in viewer store (not persisted in config)

## File Changes

### Core Package (`packages/core/`)

1. **types.ts**: Add `SmearingZone` and `ComposedSmearingZone` types
2. **route-composer.ts**:
   - Parse smearing zones from reference routes
   - Apply filtering based on vertical overlap
   - Apply anchor offset and lane offset
3. **svg-generator.ts**:
   - Generate hatched pattern definitions
   - Render smearing zone rectangles and labels
   - Add `showSmearingZones` option

### Web Package (`packages/web/`)

1. **store/viewerStore.ts**: Add `showSmearingZones` state
2. **components/DisplayOptions**: Add toggle for smearing zones

### Reference Routes (`data/`)

1. Add `smearingZones` array to reference route JSON files as needed

## Testing Strategy

1. **Unit tests**:
   - Zone position calculation
   - Zone filtering logic
   - SVG pattern generation
2. **Integration tests**:
   - Full SVG generation with zones
   - Zone visibility toggle
3. **Visual testing**:
   - Verify rendering in browser
