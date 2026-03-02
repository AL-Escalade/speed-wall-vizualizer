## 1. Core types — Virtual anchor positions

- [x] 1.1 Add `VIRTUAL_COLUMNS` constant (`BEFORE_FIRST: 'A-1'`, `AFTER_LAST: 'K+1'`), `VirtualColumn` type, and `AnchorColumn = Column | VirtualColumn` to `packages/core/src/types.ts`
- [x] 1.2 Add `VIRTUAL_ROWS` constant (`BELOW_FIRST: 0`, `ABOVE_LAST: 11`), `VirtualRow` type, and `AnchorRow = Row | VirtualRow` to `packages/core/src/types.ts`
- [x] 1.3 Update `AnchorPosition` interface to use `AnchorColumn` for `column` and `AnchorRow` for `row`
- [x] 1.4 Export new types and constants from `packages/core/src/index.ts`
- [x] 1.5 Write unit tests for type contracts in `packages/core/src/types.test.ts`

## 2. Core plate-grid — Virtual position calculation

- [x] 2.1 Add `getAnchorColumnIndex(column: AnchorColumn): number` function to `packages/core/src/plate-grid.ts` that returns -1 for `A-1`, 11 for `K+1`, and delegates to `getColumnIndex` for physical columns
- [x] 2.2 Add `getAnchorMmPosition(panel, anchor, laneOffset)` function that uses `getAnchorColumnIndex` and handles virtual rows (0 and 11) in the Y calculation
- [x] 2.3 Export new functions from `packages/core/src/index.ts`
- [x] 2.4 Write unit tests for `getAnchorColumnIndex` (physical columns, A-1, K+1) in `packages/core/src/plate-grid.test.ts`
- [x] 2.5 Write unit tests for `getAnchorMmPosition` with virtual and physical positions in `packages/core/src/plate-grid.test.ts`

## 3. Core route-composer — Accept extended anchor types

- [x] 3.1 Update `calculateMmOffset` to use `getAnchorMmPosition` instead of `getInsertPosition` for the anchor position
- [x] 3.2 Write unit tests for `calculateMmOffset` with virtual anchor columns (A-1, K+1) in `packages/core/src/route-composer.test.ts`
- [x] 3.3 Write unit tests for `calculateMmOffset` with virtual anchor rows (0, 11) in `packages/core/src/route-composer.test.ts`
- [x] 3.4 Verify existing tests still pass (no regression on physical anchor positions)

## 4. Web types and constants — Extended anchor support

- [x] 4.1 Update `AnchorPosition` in `packages/web/src/store/types.ts` to accept virtual column strings and extended row values (0, 11)
- [x] 4.2 Add virtual position constants and helpers to `packages/web/src/constants/routes.ts`: extended column labels array (including A-1 and K+1), extended row options (0-11), display label helper `getAnchorColumnDisplayLabel(storedColumn, coordinateSystem)`
- [x] 4.3 Update `AnchorPositionSchema` in `packages/web/src/utils/configValidation.ts` to accept virtual values
- [x] 4.4 Update `sectionMapper.ts` to handle virtual column/row values when converting to core `AnchorPosition` (remove strict `as CoreColumn` / `as CoreRow` casts)
- [x] 4.5 Write unit tests for `getAnchorColumnDisplayLabel` across ABC, FFME, and IFSC systems
- [x] 4.6 Write unit tests for `sectionMapper` with virtual anchor values

## 5. Web UI — Extended selects and arrow pad

- [x] 5.1 Extend the column `<select>` in `AnchorConfigurator` to include `(A-1)` as first option and virtual after-last as last option, with display labels adapted to coordinate system
- [x] 5.2 Extend the row `<select>` to include `(0)` as first option and `(11)` as last option
- [x] 5.3 Add directional arrow pad (▲ ▼ ◄ ►) in cross layout below the selects using CSS grid
- [x] 5.4 Implement arrow click handlers: ▲/▼ increment/decrement row, ◄/► navigate to previous/next column using the extended ordered column array
- [x] 5.5 Implement disabled state for each arrow button at the limits of the extended grid
- [x] 5.6 Write unit tests for arrow pad: navigation in each direction, disabled state at limits, navigation into and out of virtual positions
- [x] 5.7 Write unit tests for extended selects: virtual options are present, display labels are correct

## 6. Integration and backward compatibility

- [x] 6.1 Verify existing configs (localStorage, URL-encoded) with physical anchor values load and display correctly
- [x] 6.2 Run full test suite (`npm run test`) and confirm no regressions
- [x] 6.3 Run linter (`npm run lint`) and fix any issues
- [ ] 6.4 Manual smoke test: use arrow pad to navigate to all virtual positions, verify SVG output renders correctly with virtual anchors
