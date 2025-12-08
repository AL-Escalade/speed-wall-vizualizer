# arrow-indicator Specification Delta

## Target Spec
svg-route-generator

## ADDED Requirements

### Requirement: Arrow Indicator Global Configuration
The system SHALL support an optional arrow indicator to visualize hold orientation.

#### Scenario: Arrow indicator disabled by default
- **WHEN** generating SVG with default options
- **THEN** no arrow indicators are rendered

#### Scenario: Arrow indicator enabled
- **WHEN** generating SVG with `showArrow: true`
- **THEN** arrow indicators are rendered for each hold that supports it

### Requirement: Arrow Indicator Per Hold Type Configuration
The system SHALL support disabling arrow indicators for specific hold types via holds.json.

#### Scenario: Hold type with showArrow false
- **GIVEN** hold type STOP has `showArrow: false` in holds.json
- **WHEN** generating SVG with `showArrow: true`
- **THEN** no arrow indicator is rendered for STOP holds

#### Scenario: Hold type with showArrow true (default)
- **GIVEN** hold type BIG has no `showArrow` property in holds.json
- **WHEN** generating SVG with `showArrow: true`
- **THEN** arrow indicator is rendered for BIG holds

#### Scenario: Hold type explicitly enabling arrow
- **GIVEN** hold type FOOT has `showArrow: true` in holds.json
- **WHEN** generating SVG with `showArrow: true`
- **THEN** arrow indicator is rendered for FOOT holds

### Requirement: Arrow Indicator Geometry
The system SHALL render an isoceles triangle as an arrow indicator for each hold, sized relative to that hold's dimensions.

#### Scenario: Arrow triangle dimensions for hold
- **GIVEN** a hold with dimensions W×H (width × height)
- **WHEN** rendering the arrow indicator
- **THEN** the triangle length is 1.5 × max(W, H)
- **AND** the triangle base width is 0.5 × min(W, H)

#### Scenario: Arrow triangle position
- **GIVEN** a hold positioned at insert point P with orientation angle A
- **WHEN** rendering the arrow indicator
- **THEN** the triangle base is centered on point P
- **AND** the triangle points in direction A (from position insert toward orientation insert)

#### Scenario: Arrow triangle vertices
- **GIVEN** insert position P, direction angle A, length L, and base width W
- **WHEN** calculating triangle vertices
- **THEN** the tip vertex is at P + (cos(A), sin(A)) × L
- **AND** the left base vertex is at P + perpendicular(A) × (W/2)
- **AND** the right base vertex is at P - perpendicular(A) × (W/2)

### Requirement: Arrow Indicator Rendering
The system SHALL render arrow indicators below holds with matching colors.

#### Scenario: Arrow color matches hold color
- **GIVEN** a hold with color "#FF0000"
- **WHEN** rendering its arrow indicator
- **THEN** the arrow triangle fill is "#FF0000"

#### Scenario: Arrow rendered below hold
- **WHEN** generating SVG with `showArrow: true`
- **THEN** the arrows group appears before the holds group in the SVG
- **AND** arrows are visually behind holds when displayed

#### Scenario: Arrow for FOOT hold
- **GIVEN** a FOOT hold with dimensions 70×78mm
- **WHEN** rendering its arrow indicator with `showArrow: true`
- **THEN** the arrow length is 1.5 × 78mm = 117mm
- **AND** the arrow base width is 0.5 × 70mm = 35mm

#### Scenario: Arrow for BIG hold
- **GIVEN** a BIG hold with dimensions 350×460mm (from holds.json)
- **WHEN** rendering its arrow indicator with `showArrow: true`
- **THEN** the arrow length is 1.5 × 460mm = 690mm
- **AND** the arrow base width is 0.5 × 350mm = 175mm

#### Scenario: No arrow for STOP hold
- **GIVEN** a STOP hold with `showArrow: false` in holds.json
- **WHEN** generating SVG with `showArrow: true`
- **THEN** no arrow indicator is rendered for that hold

## MODIFIED Requirements

### Requirement: Hold Type Configuration Schema
The HoldTypeConfig interface SHALL support an optional showArrow property.

#### Scenario: HoldTypeConfig with showArrow
- **GIVEN** a hold type configuration in holds.json
- **WHEN** parsing the configuration
- **THEN** the `showArrow` property is optional
- **AND** defaults to `true` if not specified
