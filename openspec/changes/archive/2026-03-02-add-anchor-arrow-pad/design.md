## Context

The AnchorConfigurator component lets users position the first hold of a route segment via three selects: side (SN/DX), column (A-K), row (1-10). The anchor is stored in the web's `AnchorPosition` type (`{ side, column, row }`) and converted to the core's `AnchorPosition` (`{ panel, column, row }`) by `sectionToSegment()`. The core computes a mm offset between the route's original first hold and the anchor target via `calculateMmOffset()`, which calls `getInsertPosition()` → `getColumnX()` / `getRowY()`.

Current constraints:
- Core `Column` type: `'A' | 'B' | ... | 'M'` (single characters from column systems)
- Core `Row` type: `1 | 2 | ... | 10`
- `getColumnIndex()` throws on unknown columns; `getRowY()` uses `(row - 1) * ROW_SPACING`
- Web stores columns in internal ABC system (`ABCDEFGHIJK`), displays per active coordinate system
- Web `convertColumn()` already has try/catch graceful degradation for unknown columns
- Configs are persisted in localStorage, URLs, and exported files — backward compatibility is required

## Goals / Non-Goals

**Goals:**
- Allow anchor positions at virtual grid positions: columns A-1/K+1 and rows 0/11
- Provide a directional arrow pad for intuitive one-step movement
- Extend core types cleanly without breaking existing `Column`/`Row`/`InsertPosition` contracts
- Maintain full backward compatibility with existing stored configurations

**Non-Goals:**
- Changing how holds (as opposed to anchors) are positioned — holds remain on physical inserts only
- Supporting arbitrary off-grid offsets (fractional columns, arbitrary mm values)
- Adding keyboard shortcuts for arrow navigation (may come later)
- Multi-panel anchor offsets (anchor panel number stays fixed at 1)

## Decisions

### 1. New `AnchorColumn` and `AnchorRow` types in core

**Decision**: Introduce union types that extend `Column` and `Row` with virtual sentinel values.

```typescript
// types.ts
export const VIRTUAL_COLUMNS = { BEFORE_FIRST: 'A-1', AFTER_LAST: 'K+1' } as const;
export type VirtualColumn = typeof VIRTUAL_COLUMNS[keyof typeof VIRTUAL_COLUMNS];
export type AnchorColumn = Column | VirtualColumn;

export const VIRTUAL_ROWS = { BELOW_FIRST: 0, ABOVE_LAST: 11 } as const;
export type VirtualRow = typeof VIRTUAL_ROWS[keyof typeof VIRTUAL_ROWS];
export type AnchorRow = Row | VirtualRow;
```

**Rationale**: Keeps `Column`/`Row` strict for hold positions. Only `AnchorPosition` uses the extended types. Named constants make virtual values discoverable and greppable.

**Alternative considered**: Using numeric indices for virtual columns (e.g., `column: -1 | 11`). Rejected because it would change the column field from string to string|number, breaking the serialization contract and making stored configs ambiguous.

### 2. New `getAnchorColumnIndex()` function in plate-grid

**Decision**: Add a dedicated function for resolving anchor columns to grid indices, separate from `getColumnIndex()`.

```typescript
// plate-grid.ts
export function getAnchorColumnIndex(column: AnchorColumn): number {
  if (column === VIRTUAL_COLUMNS.BEFORE_FIRST) return -1;
  if (column === VIRTUAL_COLUMNS.AFTER_LAST) return GRID.COLUMNS_PER_PANEL;
  return getColumnIndex(column, CANONICAL_COLUMN_SYSTEM);
}
```

Similarly, `getAnchorRowY()` handles rows 0 and 11 by extending the existing formula.

**Rationale**: Avoids modifying `getColumnIndex()` which is used throughout the codebase for real insert positions. The new function is only called from `calculateMmOffset()` for anchor resolution.

**Alternative considered**: Adding virtual column handling inside `getColumnIndex()`. Rejected because it would weaken the validation of real insert positions — a hold at column "A-1" should remain an error.

### 3. Update `calculateMmOffset()` to use anchor-aware functions

**Decision**: Replace `getInsertPosition()` call for the anchor with a new `getAnchorMmPosition()` that uses the anchor-aware index functions.

```typescript
// route-composer.ts
function calculateMmOffset(holdPanel, holdPosition, anchor, laneOffset): MmOffset {
  const anchorPanel = parsePanelId(anchor.panel);
  const holdMm = getInsertPosition(holdPanel, holdPosition, laneOffset);   // unchanged
  const anchorMm = getAnchorMmPosition(anchorPanel, anchor, laneOffset);   // new
  return { x: anchorMm.x - holdMm.x, y: anchorMm.y - holdMm.y };
}
```

**Rationale**: Only the anchor side needs virtual position support. The hold position resolution stays strict.

### 4. Virtual position display in coordinate systems

**Decision**: Virtual columns are stored as `"A-1"` and `"K+1"` (ABC internal system). Display adapts per coordinate system by computing the display label from the system's first/last column letter.

| Stored (ABC) | Display ABC | Display FFME | Display IFSC |
|---|---|---|---|
| `A-1` | (A-1) | (A-1) | (A-1) |
| `K+1` | (K+1) | (L+1) | (M+1) |

Implementation: a helper function `getAnchorColumnDisplayLabel(storedColumn, coordinateSystem)` checks for sentinel values and constructs the appropriate display string. Virtual columns bypass `convertColumn()` entirely.

**Rationale**: All systems start with A, so "A-1" is universal. The last column differs, so "K+1" must adapt. Parentheses visually distinguish virtual from physical positions.

### 5. Arrow pad component design

**Decision**: Add the directional pad as inline JSX within `AnchorConfigurator`, not as a separate component.

Layout (using CSS grid):
```
         [  ▲  ]
   [ ◄ ] [     ] [ ► ]
         [  ▼  ]
```

Each button:
- Calls `updateField` / `handleColumnChange` with the adjacent value
- Is `disabled` when at the limit of the extended grid
- Uses compact `btn-sm btn-square` styling (DaisyUI)
- Uses Unicode arrows: ▲ ▼ ◄ ►

Navigation logic uses an ordered array of all valid column values (including virtuals) and finds the current index to step ±1. Same for rows with the extended 0-11 range.

**Rationale**: The pad is tightly coupled to the anchor state and small enough to not warrant a separate component. The ordered array approach handles coordinate system differences cleanly.

### 6. Extended select options

**Decision**: The column and row selects are extended to include virtual positions at the edges, displayed with parentheses.

```
Column select:  (A-1)  A  B  C  ...  K  (K+1)
Row select:     (0)    1  2  3  ...  10  (11)
```

Virtual options use the same `<option>` element with the stored sentinel value, and the display label in parentheses.

**Rationale**: Users should be able to both click arrows AND directly select virtual positions from the dropdown.

## Risks / Trade-offs

**[Risk] Virtual column strings in serialized configs** → Users who share a config with virtual anchor positions to someone on an older version would see the anchor ignored or reset. This is acceptable since the feature is additive and the fallback is the route's default first hold position.

**[Risk] Core `AnchorPosition.column` type widening** → Any code doing `anchor.column.length === 1` or similar assumptions would break. → Mitigation: search for such patterns before implementation; the `as CoreColumn` cast in `sectionMapper.ts` needs updating.

**[Trade-off] Sentinel strings ("A-1", "K+1") vs numeric representation** → Strings are readable in JSON but require string matching. Accepted for clarity in stored configs and debuggability.
