# virtual-anchor-positions Specification

## Purpose
Defines virtual anchor positions that extend the physical grid by one position in each direction (columns A-1 and K+1, rows 0 and 11), enabling anchoring routes outside the standard insert grid while maintaining type safety and backward compatibility.

## Requirements
### Requirement: Virtual anchor column types
The core type system SHALL define virtual column positions `A-1` (before first column) and `K+1` (after last column) as valid anchor-only column values, distinct from physical insert columns.

#### Scenario: AnchorColumn type accepts virtual columns
- **WHEN** an AnchorPosition is created with column `A-1`
- **THEN** the value SHALL be accepted as a valid AnchorColumn

#### Scenario: AnchorColumn type accepts physical columns
- **WHEN** an AnchorPosition is created with column `F`
- **THEN** the value SHALL be accepted as a valid AnchorColumn

#### Scenario: Column type rejects virtual columns
- **WHEN** an InsertPosition is created with column `A-1`
- **THEN** the value SHALL NOT be accepted as a valid Column (type error)

### Requirement: Virtual anchor row types
The core type system SHALL define virtual row positions `0` (below row 1) and `11` (above row 10) as valid anchor-only row values, distinct from physical insert rows.

#### Scenario: AnchorRow type accepts virtual rows
- **WHEN** an AnchorPosition is created with row `0`
- **THEN** the value SHALL be accepted as a valid AnchorRow

#### Scenario: AnchorRow type accepts physical rows
- **WHEN** an AnchorPosition is created with row `5`
- **THEN** the value SHALL be accepted as a valid AnchorRow

### Requirement: Virtual column mm position calculation
The system SHALL compute mm positions for virtual anchor columns at one column-spacing distance beyond the physical grid edges.

#### Scenario: Position of virtual column A-1
- **WHEN** computing the X position for anchor column `A-1` on the SN side
- **THEN** the X position SHALL be `PANEL_MARGIN_HORIZONTAL + (-1) * COLUMN_SPACING` (one column-spacing to the left of column A)

#### Scenario: Position of virtual column K+1
- **WHEN** computing the X position for anchor column `K+1` on the SN side
- **THEN** the X position SHALL be `PANEL_MARGIN_HORIZONTAL + 11 * COLUMN_SPACING` (one column-spacing to the right of column K)

### Requirement: Virtual row mm position calculation
The system SHALL compute mm positions for virtual anchor rows at one row-spacing distance beyond the physical grid edges.

#### Scenario: Position of virtual row 0
- **WHEN** computing the Y position for anchor row `0` on panel 1
- **THEN** the Y position SHALL be `PANEL_MARGIN_VERTICAL + (0 - 1) * ROW_SPACING` (one row-spacing below row 1)

#### Scenario: Position of virtual row 11
- **WHEN** computing the Y position for anchor row `11` on panel 1
- **THEN** the Y position SHALL be `PANEL_MARGIN_VERTICAL + (11 - 1) * ROW_SPACING` (one row-spacing above row 10)

### Requirement: Virtual column display adapts to coordinate system
The UI SHALL display virtual column labels with parentheses, adapting the last-column-based label to the active coordinate system.

#### Scenario: Display A-1 in any system
- **WHEN** the anchor column is `A-1`
- **AND** the coordinate system is ABC, FFME, or IFSC
- **THEN** the display label SHALL be `(A-1)`

#### Scenario: Display K+1 in ABC system
- **WHEN** the anchor column is `K+1` (stored in ABC)
- **AND** the active coordinate system is ABC
- **THEN** the display label SHALL be `(K+1)`

#### Scenario: Display K+1 in FFME system
- **WHEN** the anchor column is `K+1` (stored in ABC)
- **AND** the active coordinate system is FFME
- **THEN** the display label SHALL be `(L+1)`

#### Scenario: Display K+1 in IFSC system
- **WHEN** the anchor column is `K+1` (stored in ABC)
- **AND** the active coordinate system is IFSC
- **THEN** the display label SHALL be `(M+1)`

### Requirement: Virtual row display with parentheses
The UI SHALL display virtual row values with parentheses to distinguish them from physical rows.

#### Scenario: Display virtual row 0
- **WHEN** the anchor row is `0`
- **THEN** the row select SHALL display `(0)`

#### Scenario: Display virtual row 11
- **WHEN** the anchor row is `11`
- **THEN** the row select SHALL display `(11)`

#### Scenario: Display physical row without parentheses
- **WHEN** the anchor row is `5`
- **THEN** the row select SHALL display `5` (no parentheses)

### Requirement: Extended select options include virtual positions
The column and row select dropdowns SHALL include virtual positions at the edges of their option lists.

#### Scenario: Column select includes virtual positions
- **WHEN** the column select dropdown is rendered
- **THEN** the first option SHALL be the virtual `(A-1)` position
- **AND** the last option SHALL be the virtual after-last-column position
- **AND** all physical columns appear between them in order

#### Scenario: Row select includes virtual positions
- **WHEN** the row select dropdown is rendered
- **THEN** the first option SHALL be `(0)`
- **AND** the last option SHALL be `(11)`
- **AND** rows 1 through 10 appear between them in order

### Requirement: Backward compatibility of anchor values
Existing configurations with anchor column values A-K and row values 1-10 SHALL continue to work without migration.

#### Scenario: Legacy config with physical anchor loads correctly
- **WHEN** a configuration with anchor `{ side: 'SN', column: 'F', row: 5 }` is loaded from localStorage
- **THEN** the anchor SHALL be interpreted and displayed as column F, row 5

#### Scenario: Config with virtual anchor shared to older version
- **WHEN** a configuration with anchor `{ side: 'SN', column: 'A-1', row: 0 }` is decoded by a version without virtual position support
- **THEN** the anchor column and row values SHALL be stored as-is (strings/numbers) and gracefully handled by the validation layer
