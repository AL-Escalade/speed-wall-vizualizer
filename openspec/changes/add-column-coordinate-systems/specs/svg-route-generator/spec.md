## ADDED Requirements

### Requirement: Column Coordinate System Declaration

The system SHALL support declaring the column coordinate system used in route JSON files via an optional `columns` field.

#### Scenario: Route with IFSC coordinate system
- **WHEN** a route JSON contains `"columns": "ABCDEFGHILM"`
- **THEN** the system interprets column letters according to the IFSC system
- **AND** column "L" maps to internal index 9
- **AND** column "M" maps to internal index 10

#### Scenario: Route with FFME coordinate system
- **WHEN** a route JSON contains `"columns": "ABCDEFGHIKL"`
- **THEN** the system interprets column letters according to the FFME system
- **AND** column "K" maps to internal index 9
- **AND** column "L" maps to internal index 10

#### Scenario: Route with default ABC coordinate system
- **WHEN** a route JSON contains `"columns": "ABCDEFGHIJK"` or no `columns` field
- **THEN** the system interprets column letters according to the ABC system
- **AND** column "J" maps to internal index 9
- **AND** column "K" maps to internal index 10

#### Scenario: Invalid column in hold position
- **WHEN** parsing a hold with column "M" in a route with `"columns": "ABCDEFGHIJK"`
- **THEN** the system throws an error indicating the invalid column
- **AND** the error message includes the expected valid columns

### Requirement: Column System Validation

The system SHALL validate that all hold coordinates use only columns defined in the route's coordinate system.

#### Scenario: Valid coordinates
- **WHEN** parsing a route with `"columns": "ABCDEFGHILM"`
- **AND** all holds use columns from A to M (excluding J and K)
- **THEN** parsing succeeds

#### Scenario: Invalid column letter
- **WHEN** parsing a route with `"columns": "ABCDEFGHILM"`
- **AND** a hold uses column "J" or "K"
- **THEN** parsing fails with a descriptive error

## MODIFIED Requirements

### Requirement: Reference Routes Data

The system SHALL include reference route data for IFSC, U15 and U11/U13 with hold dimensions per type, color, positions, and coordinate system declaration.

#### Scenario: Reference route metadata
- **WHEN** loading a reference route
- **THEN** it contains dimensions for each hold type used (e.g., BIG, FOOT)
- **AND** each hold type has width and height in mm
- **AND** it contains a color for the holds
- **AND** it contains an optional `columns` field declaring the coordinate system

#### Scenario: Reference route holds
- **WHEN** loading a reference route
- **THEN** each hold contains panel, type, position and orientation in compact format
- **AND** position and orientation columns are validated against the declared coordinate system

#### Scenario: Parse BIG hold format
- **WHEN** parsing the line `DX2 BIG F1 D3`
- **THEN** output is panel=DX2, type=BIG, position=F1, orientation=D3

#### Scenario: Parse FOOT hold format
- **WHEN** parsing the line `DX1 FOOT F4 G4`
- **THEN** output is panel=DX1, type=FOOT, position=F4, orientation=G4

#### Scenario: Custom hold types
- **WHEN** a reference route defines a custom hold type (e.g., VOLUME)
- **THEN** the system loads the corresponding SVG file (VOLUME.svg)
- **AND** applies the dimensions defined for that type
