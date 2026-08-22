# svg-route-generator Spec Delta

## MODIFIED Requirements

### Requirement: Hold Coloring

The system SHALL color hold shapes according to the colors defined in their source
reference route, resolving each hold through its optional color tag.

#### Scenario: Apply route color to hold
- **WHEN** rendering a hold from a reference route with color "#FF0000"
- **THEN** the `<path id="prise">` element fill is set to "#FF0000"

#### Scenario: Different colors per route
- **WHEN** IFSC route defines color "#FF0000" and U11/U13 defines color "#00FF00"
- **THEN** IFSC holds are red and U11/U13 holds are green

#### Scenario: Several colors within one route
- **GIVEN** a route declares `"color": { "RED": "#FF0000", "DARKGREEN": "#006400" }`
- **WHEN** rendering a hold with no color tag
- **THEN** the hold is red, the first declared color
- **AND** a hold tagged `#DARKGREEN` is dark green

#### Scenario: Undeclared color tag
- **GIVEN** a hold carries a tag absent from its route's color map
- **WHEN** the hold is rendered
- **THEN** it falls back to the route's default color
- **AND** no error is raised

## ADDED Requirements

### Requirement: Route Color Map

The system SHALL accept either a single color or a map of color tags in a
reference route's `color` field.

#### Scenario: Single color declaration
- **GIVEN** a reference route declares `"color": "#FF0000"`
- **WHEN** the route is loaded
- **THEN** its color map is `{ "DEFAULT": "#FF0000" }`
- **AND** its default color tag is `DEFAULT`

#### Scenario: Color map declaration
- **GIVEN** a reference route declares `"color": { "RED": "#FF0000", "DARKGREEN": "#006400" }`
- **WHEN** the route is loaded
- **THEN** its color map preserves declaration order
- **AND** its default color tag is `RED`

#### Scenario: Validate color tags of a route
- **GIVEN** a route whose holds or smearing zones reference an undeclared tag
- **WHEN** the route is validated
- **THEN** one problem is reported per offending hold or zone
- **AND** a route with an empty color map is reported as a problem

### Requirement: Hold Color Tag Parsing

The system SHALL parse an optional `#COLORTAG` token in the compact hold string.

#### Scenario: Parse a tagged hold
- **WHEN** parsing `"DX1 FOOT C3 C4 @G1 #DARKGREEN"`
- **THEN** the hold's color tag is `DARKGREEN`
- **AND** its label is `G1`

#### Scenario: Optional trailing tokens in any order
- **WHEN** parsing `"SN2 BIG C3 D4 #GREEN 0.9 @M1"`
- **THEN** the label is `M1`, the scale is 0.9 and the color tag is `GREEN`

#### Scenario: Untagged hold
- **WHEN** parsing `"DX2 BIG F1 D3 @H1"`
- **THEN** the hold has no color tag

#### Scenario: Empty color tag
- **WHEN** parsing a hold whose token is only `#`
- **THEN** an error describing an invalid color tag is raised

### Requirement: Hold Type Forced Color

The system SHALL let a hold type declare a color that overrides its route's color.

#### Scenario: Finish pads stay dark
- **GIVEN** the `STOP` hold type declares a color
- **WHEN** rendering an untagged `STOP` hold in any route
- **THEN** the hold and its label use the hold type's color
- **AND** the route's own color is not used

#### Scenario: Explicit tag wins over the hold type color
- **GIVEN** a `STOP` hold carries an explicit color tag
- **WHEN** it is rendered
- **THEN** the tagged color is used instead of the hold type's color

### Requirement: Segment Color Overrides

The system SHALL resolve segment color overrides per tag when `colors` is present,
and uniformly otherwise.

#### Scenario: Legacy uniform override
- **GIVEN** a segment declares `color` and no `colors`
- **WHEN** its holds are composed
- **THEN** every hold uses that color regardless of its tag

#### Scenario: Partial per-tag override
- **GIVEN** a segment declares `"colors": { "DARKGREEN": "#123456" }`
- **WHEN** its holds are composed
- **THEN** holds tagged `DARKGREEN` use "#123456"
- **AND** holds of other tags use the route's colors

#### Scenario: Empty override map
- **GIVEN** a segment declares `"colors": {}`
- **WHEN** its holds are composed
- **THEN** every hold uses the route's colors
- **AND** any `color` declared alongside is ignored

#### Scenario: Smearing zone color
- **GIVEN** a smearing zone carries no color tag
- **WHEN** it is composed
- **THEN** it resolves at the route's default color tag
