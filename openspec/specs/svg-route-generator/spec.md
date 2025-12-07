# svg-route-generator Specification

## Purpose
TBD - created by archiving change add-svg-route-generator. Update Purpose after archive.
## Requirements
### Requirement: Wall Grid Model
The system SHALL model a speed climbing wall according to IFSC specifications with a configurable insert grid.

#### Scenario: Standard IFSC wall configuration
- **WHEN** a wall is created with default configuration
- **THEN** it contains 2 lanes (SN and DX)
- **AND** each lane has 10 panels height
- **AND** each panel has 11 columns (A-M, excluding J/K) and 10 rows of inserts

#### Scenario: Custom wall configuration
- **WHEN** a wall is created with `lanes: 1` and `panelsHeight: 5`
- **THEN** it contains 1 lane with 5 panels height

### Requirement: Insert Position Calculation
The system SHALL calculate the absolute position (in mm) of each insert from its coordinates (lane, panel, column, row).

#### Scenario: Calculate insert position
- **WHEN** requesting the position of insert DX2-F1
- **THEN** the X position is calculated as DX lane offset + (F column index × 125mm)
- **AND** the Y position is calculated as (2-1) × 1437.5mm + 187.5mm + (1-1) × 125mm

### Requirement: Reference Routes Data
The system SHALL include reference route data for IFSC, U15 and U11/U13 with hold dimensions per type, color and positions.

#### Scenario: Reference route metadata
- **WHEN** loading a reference route
- **THEN** it contains dimensions for each hold type used (e.g., BIG, FOOT)
- **AND** each hold type has width and height in mm
- **AND** it contains a color for the holds

#### Scenario: Reference route holds
- **WHEN** loading a reference route
- **THEN** each hold contains panel, type, position and orientation in compact format

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

### Requirement: Route Segment Composition
The system SHALL allow composing a route from segments of different reference routes.

#### Scenario: Compose route from multiple sources
- **WHEN** configuring segment `source: u11-u13, fromHold: 1, toHold: 8` followed by `source: ifsc, fromHold: 9, toHold: 20`
- **THEN** the generated route contains holds 1-8 from U11/U13 and holds 9-20 from IFSC
- **AND** positions are adjusted to create a continuous route

### Requirement: Hold Rotation Calculation
The system SHALL calculate the rotation angle of each hold according to its orientation.

#### Scenario: Calculate rotation angle
- **WHEN** a hold is positioned on insert F1 with orientation towards D3
- **THEN** the rotation angle is calculated as atan2(y_D3 - y_F1, x_D3 - x_F1)
- **AND** the angle is adjusted based on the default orientation for the hold type

#### Scenario: Default orientation for BIG
- **WHEN** a BIG hold has no specified orientation
- **THEN** the arrow points downward (0°)

#### Scenario: Default orientation for FOOT
- **WHEN** a FOOT hold has no specified orientation
- **THEN** the arrow points left (90°)

### Requirement: SVG Hold Structure
The system SHALL parse hold SVG files containing named elements for manipulation.

#### Scenario: Parse hold SVG structure
- **WHEN** loading a hold SVG file
- **THEN** the system extracts the `<path id="prise">` element for the hold shape
- **AND** the system extracts the `<circle id="insert">` element as anchor point
- **AND** the center (cx, cy) of the circle defines the insertion point

### Requirement: SVG Hold Scaling
The system SHALL scale hold SVG files according to the dimensions defined for each hold type in the reference route.

#### Scenario: Scale BIG hold from dimensions
- **WHEN** rendering a BIG hold from a route with BIG dimensions 460×350mm
- **THEN** the BIG.svg is scaled so the hold appears at 460mm width and 350mm height

#### Scenario: Scale FOOT hold from dimensions
- **WHEN** rendering a FOOT hold from a route with FOOT dimensions 70×78mm
- **THEN** the FOOT.svg is scaled so the hold appears at 70mm width and 78mm height

#### Scenario: Different dimensions per route
- **WHEN** U11/U13 route defines smaller BIG dimensions than IFSC
- **THEN** U11/U13 BIG holds are rendered smaller than IFSC BIG holds

#### Scenario: Load SVG by hold type
- **WHEN** rendering a hold of type "CUSTOM"
- **THEN** the system loads CUSTOM.svg from the assets folder

### Requirement: Hold Coloring
The system SHALL color hold shapes according to the color defined in their source reference route.

#### Scenario: Apply route color to hold
- **WHEN** rendering a hold from a reference route with color "#FF0000"
- **THEN** the `<path id="prise">` element fill is set to "#FF0000"

#### Scenario: Different colors per route
- **WHEN** IFSC route defines color "#FF0000" and U11/U13 defines color "#00FF00"
- **THEN** IFSC holds are red and U11/U13 holds are green

### Requirement: SVG Grid Rendering
The system SHALL generate an SVG displaying the insert grid with coordinates.

#### Scenario: Render insert grid
- **WHEN** generating the wall SVG
- **THEN** each insert is represented by a marker
- **AND** columns are labeled A-M
- **AND** rows are labeled 1-10
- **AND** panels are labeled SN1-SN10 and DX1-DX10

### Requirement: SVG Hold Rendering
The system SHALL generate an SVG placing each hold at its position with correct rotation.

#### Scenario: Render hold at position
- **WHEN** rendering a hold positioned on DX2-F1 with orientation D3
- **THEN** the hold SVG is included at the absolute position of DX2-F1
- **AND** the insertion point (red circle in source SVG) is aligned on the insert
- **AND** the hold is rotated according to the calculated angle

### Requirement: Multiple Output Formats
The system SHALL support multiple output formats: SVG, PDF, and PNG.

#### Scenario: Generate SVG output
- **WHEN** executing with `--format svg` or no format specified
- **THEN** an SVG file is generated

#### Scenario: Generate PDF output
- **WHEN** executing with `--format pdf`
- **THEN** a PDF file is generated from the wall rendering

#### Scenario: Generate PNG output
- **WHEN** executing with `--format png`
- **THEN** a PNG image is generated from the wall rendering

### Requirement: CLI Interface
The system SHALL provide a CLI interface to generate the wall visualization.

#### Scenario: Generate from config file
- **WHEN** executing `tsx src/cli.ts --config wall-config.json`
- **THEN** an output file is generated according to the configuration

#### Scenario: Output to custom file
- **WHEN** executing `tsx src/cli.ts --config wall-config.json --output wall.svg`
- **THEN** the output is written to the file `wall.svg`

#### Scenario: Specify output format
- **WHEN** executing `tsx src/cli.ts --config wall-config.json --format pdf`
- **THEN** a PDF file is generated

