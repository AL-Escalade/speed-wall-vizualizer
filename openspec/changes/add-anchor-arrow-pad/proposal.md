## Why

Moving a route's anchor position currently requires manually selecting values in three separate dropdowns (side, column, row). This makes it tedious to explore different placements, especially when fine-tuning. Additionally, the current system only allows anchoring on physical insert positions (columns A-K, rows 1-10), but users need to place routes at virtual positions between panels where no physical insert exists — these positions are at the same spacing as real inserts.

## What Changes

- **Directional arrow pad**: A cross-shaped pad (▲▼◄►) is added below the existing side/column/row selects in the AnchorConfigurator component. Each arrow moves the anchor by one grid step. Buttons are disabled at the limits of the extended grid.
- **Virtual column positions**: Two new anchor-only column positions `A-1` (before first column) and `K+1` (after last column) are introduced. These represent positions at one column-spacing distance beyond the physical grid, where no insert exists. They are stored in the internal ABC coordinate system and displayed with parentheses, adapting to the active coordinate system (e.g., `(L+1)` in FFME, `(M+1)` in IFSC).
- **Virtual row positions**: Two new anchor-only row values `0` (below row 1) and `11` (above row 10) are introduced. Displayed with parentheses in the UI.
- **Extended core types**: New `AnchorColumn` and `AnchorRow` types extend the existing `Column` and `Row` types to include virtual positions. The `AnchorPosition` interface uses these extended types. Existing `Column`, `Row`, and `InsertPosition` types remain unchanged — they represent physical insert positions only.

## Capabilities

### New Capabilities
- `anchor-arrow-pad`: Directional arrow pad UI for moving anchor position by one grid step, with disabled state at grid limits
- `virtual-anchor-positions`: Support for virtual (off-grid) anchor column and row positions in core types, position calculation, and web UI display

### Modified Capabilities
- `svg-route-generator`: The `AnchorPosition` type gains extended column/row types (`AnchorColumn`, `AnchorRow`) to support virtual positions. The `calculateMmOffset` function accepts these extended types. **No breaking change** — existing valid anchor values remain valid.

## Impact

- **`packages/core/src/types.ts`**: New `AnchorColumn`, `AnchorRow` types. `AnchorPosition` interface updated.
- **`packages/core/src/plate-grid.ts`**: New or adapted functions to resolve anchor column/row to grid index (handling virtual positions). `getInsertPosition` or a new `getAnchorPosition` variant.
- **`packages/core/src/route-composer.ts`**: `calculateMmOffset` accepts extended anchor types.
- **`packages/web/src/components/section/AnchorConfigurator.tsx`**: Arrow pad UI, extended select options, virtual position display with parentheses.
- **`packages/web/src/store/types.ts`**: Web `AnchorPosition` updated to accept virtual values.
- **`packages/web/src/constants/routes.ts`**: Extended column labels including virtual positions.
- **`packages/web/src/utils/sectionMapper.ts`**: Conversion handles virtual anchor values.
- **Backward compatibility**: Existing configs (localStorage, URLs, exported files) use values within the current range and remain fully valid. No migration needed.
