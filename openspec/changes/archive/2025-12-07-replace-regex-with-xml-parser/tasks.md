# Tasks: Replace Regex with XML Parser

## Phase 1: Setup

- [x] Install `@xmldom/xmldom` package
- [x] Add TypeScript types (included in package)

## Phase 2: Core Parser Infrastructure

- [x] Create `parseSvgDocument()` function using DOMParser
- [x] Create `findElementById()` helper function
- [x] Create `findElementByAttribute()` helper function
- [x] Create `findElementByInkscapeLabel()` helper function (merged into `findElementByIdOrLabel`)
- [x] Create `getAllElementsByTagName()` helper with filtering (via `getElementsByTagName` directly)
- [x] Create `elementToString()` function using XMLSerializer

## Phase 3: Refactor Extraction Functions

- [x] Refactor `extractViewBox()` to use DOM getAttribute
- [x] Refactor `extractCircleCenter()` to use DOM element selection
- [x] Refactor `extractPathElement()` to use DOM element selection
- [x] Refactor `extractAllCircles()` to use getElementsByTagName
- [x] Refactor `extractAllVisualElements()` to use DOM traversal
- [x] Refactor `extractLabelZones()` to use DOM element selection

## Phase 4: Refactor Cleaning Functions

- [x] Refactor `cleanSvgElement()` to use DOM attribute manipulation (merged into `removeUnwantedAttributes`)
- [x] Refactor `cleanCircleElement()` to use DOM attribute manipulation (merged into `removeUnwantedAttributes`)
- [x] Refactor `cleanTextElement()` to use DOM attribute manipulation (merged into `removeUnwantedAttributes`)
- [x] Create `removeNamespacedAttributes()` helper function (named `removeUnwantedAttributes`)

## Phase 5: Keep Transform Parsing (String-based)

- [x] Keep `parseTransformMatrix()` as-is (operates on attribute value strings)
- [x] Keep `extractRotation()` as-is (operates on attribute value strings)
- [x] Keep `simplifyCompoundPath()` as-is (operates on path d attribute string)

## Phase 6: Validation

- [x] Generate output SVGs with both implementations
- [x] Compare outputs to ensure identical results (via xmllint --c14n normalization)
- [x] Run visual comparison on all hold types (BIG, FOOT, STOP, PAD)
- [x] Generate full wall SVGs and compare

## Phase 7: Cleanup

- [x] Remove unused regex patterns (all regex removed)
- [x] Update code comments and documentation
- [x] Remove any dead code

## Dependencies

- Phase 2 depends on Phase 1
- Phases 3-4 depend on Phase 2
- Phase 5 is independent (no changes needed)
- Phase 6 depends on Phases 3-4
- Phase 7 depends on Phase 6

## Parallelization

- Phase 3 tasks can be done in parallel once Phase 2 is complete
- Phase 4 tasks can be done in parallel with Phase 3
