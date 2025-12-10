## 1. Core Types and Schema

- [x] 1.1 Add `ColumnSystem` type and predefined systems (ABC, FFME, IFSC) to `packages/core/src/types.ts`
- [x] 1.2 Update `route.schema.json` to add optional `columns` field with validation pattern
- [x] 1.3 Add column conversion utilities to `packages/core/src/plate-grid.ts` (letter to index, index to letter for any system)

## 2. Route Parsing with Validation

- [x] 2.1 Update `parseInsertPosition` in `packages/core/src/plate-grid.ts` to accept column system parameter
- [x] 2.2 Update `cli/src/reference-routes/index.ts` to read `columns` field from JSON and validate hold coordinates
- [x] 2.3 Add validation error messages with helpful context (expected columns, route name)

## 3. Update Route Data Files

- [x] 3.1 Add `"columns": "ABCDEFGHILM"` to `data/routes/ifsc.json` and restore original IFSC coordinates
- [x] 3.2 Add `"columns": "ABCDEFGHILM"` to `data/routes/training.json` for IFSC-derived holds and restore coordinates
- [x] 3.3 Add `"columns": "ABCDEFGHIKL"` to `data/routes/u15.json` (FFME system)
- [x] 3.4 Add `"columns": "ABCDEFGHIKL"` to `data/routes/u11-u13.json` (FFME system)
- [x] 3.5 Validate all route files load correctly with `npm run build`

## 4. Web App Display Options

- [x] 4.1 Add `coordinateDisplaySystem` field to `SavedConfiguration` in `web/src/store/types.ts`
- [x] 4.2 Add coordinate system constants to `web/src/constants/routes.ts`
- [x] 4.3 Create coordinate system selector component (in Sidebar DisplayOptions)
- [x] 4.4 Update grid rendering to use selected coordinate system for column labels
- [x] 4.5 Add persistence of coordinate display preference in localStorage (via zustand persist)

## 5. Testing and Validation

- [x] 5.1 Test that IFSC route loads with original coordinates
- [x] 5.2 Test that invalid column throws descriptive error
- [x] 5.3 Test coordinate system selector in web app
- [x] 5.4 Verify SVG output shows correct column labels for each system
