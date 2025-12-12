# svg-route-generator Spec Delta

## ADDED Requirements

### Requirement: Smearing Zone Data Model

The system SHALL support smearing zone definitions in reference route JSON files.

#### Scenario: Parse smearing zone from reference route
- **GIVEN** a reference route JSON contains a `smearingZones` array
- **WHEN** the route is loaded
- **THEN** each zone contains `label`, `panel`, `column`, `row`, `width`, and `height`
- **AND** `label` is a string identifying the zone (e.g., "Z1")
- **AND** `panel` is a panel identifier (e.g., "DX1", "SN3")
- **AND** `column` is a column letter (A-L) for the bottom-left corner
- **AND** `row` is a row number (1-10) for the bottom-left corner
- **AND** `width` is a positive float representing width in insert units
- **AND** `height` is a positive float representing height in insert units

#### Scenario: Reference route without smearing zones
- **GIVEN** a reference route JSON does not contain a `smearingZones` field
- **WHEN** the route is loaded
- **THEN** the route has an empty smearing zones array
- **AND** no error is raised

### Requirement: Smearing Zone Position Calculation

The system SHALL calculate the absolute position and dimensions of smearing zones in millimeters.

#### Scenario: Calculate zone base position
- **WHEN** calculating the position of a smearing zone with panel "DX1", column "E", row "3"
- **THEN** the bottom-left corner position is calculated using the same logic as insert positions
- **AND** the X position corresponds to column E in panel DX1
- **AND** the Y position corresponds to row 3 in panel DX1

#### Scenario: Calculate zone dimensions
- **WHEN** calculating dimensions of a zone with width 2.5 and height 4.0
- **THEN** the width in mm equals 2.5 times the column spacing (125mm)
- **AND** the height in mm equals 4.0 times the row spacing (125mm)

#### Scenario: Zone spanning multiple panels
- **WHEN** a zone has height that extends beyond the current panel
- **THEN** the zone is rendered continuously across panel boundaries

### Requirement: Smearing Zone Composition

The system SHALL compose smearing zones following the same rules as holds for segment composition.

#### Scenario: Apply anchor offset to zones
- **GIVEN** a segment has an anchor position defined
- **WHEN** composing smearing zones from that segment
- **THEN** zones are offset by the same amount as holds
- **AND** zones maintain their relative position to holds

#### Scenario: Apply lane offset to zones
- **GIVEN** a segment has laneOffset > 0
- **WHEN** composing smearing zones from that segment
- **THEN** zones are shifted horizontally by the lane offset

#### Scenario: Inherit color from route
- **GIVEN** a reference route defines color "#0000FF"
- **WHEN** composing smearing zones from that route
- **THEN** zones inherit the color "#0000FF"

#### Scenario: Override color from segment
- **GIVEN** a segment overrides color with "#FF6600"
- **WHEN** composing smearing zones from that segment
- **THEN** zones use the override color "#FF6600"

### Requirement: Smearing Zone Filtering

The system SHALL filter smearing zones based on vertical overlap with selected holds when segments use fromHold/toHold.

#### Scenario: Zone overlaps selected holds range
- **GIVEN** a segment selects holds from Y=500mm to Y=2000mm
- **AND** a smearing zone spans Y=400mm to Y=1500mm
- **WHEN** composing the segment
- **THEN** the zone is included (it starts before highest hold AND ends after lowest hold)

#### Scenario: Zone above selected holds range
- **GIVEN** a segment selects holds from Y=500mm to Y=1000mm
- **AND** a smearing zone spans Y=1500mm to Y=2000mm
- **WHEN** composing the segment
- **THEN** the zone is excluded (zone starts after highest selected hold)

#### Scenario: Zone below selected holds range
- **GIVEN** a segment selects holds from Y=1500mm to Y=2000mm
- **AND** a smearing zone spans Y=500mm to Y=1000mm
- **WHEN** composing the segment
- **THEN** the zone is excluded (zone ends before lowest selected hold)

#### Scenario: Full route selection includes all zones
- **GIVEN** a segment does not specify fromHold/toHold
- **WHEN** composing the segment
- **THEN** all smearing zones from the reference route are included

### Requirement: Smearing Zone SVG Rendering

The system SHALL render smearing zones as hatched rectangles in the SVG output.

#### Scenario: Render zone rectangle
- **WHEN** rendering a smearing zone at position (x, y) with dimensions (width, height)
- **THEN** the SVG contains a rectangle at that position with those dimensions
- **AND** the rectangle has a solid fill with the zone color at 50% opacity
- **AND** the rectangle has a diagonal hatched pattern overlay

#### Scenario: Render hatched pattern
- **WHEN** rendering smearing zones
- **THEN** the SVG defines a pattern with diagonal lines at 45 degrees
- **AND** the pattern lines use the zone color
- **AND** each unique color has its own pattern definition

#### Scenario: Render zone label
- **WHEN** rendering a smearing zone with label "Z1"
- **THEN** the label "Z1" is positioned at the bottom-left of the rectangle
- **AND** the text is left-aligned with the rectangle edge
- **AND** the font size is the same as hold labels (40px by default)
- **AND** the text color matches the zone color

#### Scenario: Z-order of zones
- **WHEN** rendering the full SVG
- **THEN** smearing zones are rendered after the grid
- **AND** smearing zones are rendered before arrow indicators
- **AND** smearing zones are rendered before holds

### Requirement: Smearing Zone Visibility Option

The system SHALL support an option to show or hide smearing zones in the SVG output.

#### Scenario: Show smearing zones (default)
- **GIVEN** `showSmearingZones` option is not specified or is `true`
- **WHEN** generating the SVG
- **THEN** smearing zones are rendered

#### Scenario: Hide smearing zones
- **GIVEN** `showSmearingZones` option is `false`
- **WHEN** generating the SVG
- **THEN** smearing zones are not rendered

### Requirement: Backward Compatibility

The system SHALL maintain backward compatibility with existing configurations that do not include smearing zones.

#### Scenario: Existing configuration without smearing zones in reference route
- **GIVEN** an existing user configuration references a route source (e.g., "ifsc")
- **AND** the reference route JSON does not contain a `smearingZones` field
- **WHEN** the configuration is loaded from localStorage
- **THEN** the configuration loads successfully
- **AND** no smearing zones are displayed
- **AND** no error is raised

#### Scenario: Existing configuration with updated reference route
- **GIVEN** an existing user configuration references a route source (e.g., "ifsc")
- **AND** the reference route JSON has been updated to include `smearingZones`
- **WHEN** the configuration is loaded from localStorage
- **THEN** the configuration loads successfully
- **AND** smearing zones from the updated reference route are displayed
- **AND** zones follow the segment's anchor offset and lane offset

#### Scenario: Configuration imported from URL without smearing zones
- **GIVEN** a configuration is shared via URL
- **AND** the configuration was created before smearing zones were added
- **WHEN** the URL is opened
- **THEN** the configuration loads successfully
- **AND** smearing zones from reference routes are displayed (if any exist in current reference routes)

#### Scenario: Configuration imported from JSON file
- **GIVEN** a configuration JSON file was exported before smearing zones were added
- **WHEN** the file is imported
- **THEN** the configuration loads successfully
- **AND** smearing zones from reference routes are displayed (if any exist in current reference routes)

#### Scenario: User configuration schema unchanged
- **GIVEN** the existing user configuration schema (wall, routes, segments)
- **WHEN** smearing zones feature is deployed
- **THEN** the user configuration schema remains unchanged
- **AND** smearing zones are sourced only from reference route definitions
- **AND** no migration of existing configurations is required
