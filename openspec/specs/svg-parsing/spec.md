# svg-parsing Specification

## Purpose
TBD - created by archiving change replace-regex-with-xml-parser. Update Purpose after archive.
## Requirements
### Requirement: XML-based SVG Parsing

The system SHALL parse SVG files using a standards-compliant XML DOM parser instead of regular expressions.

#### Scenario: Parse valid SVG document
- **GIVEN** an SVG file with valid XML structure
- **WHEN** the file is loaded for parsing
- **THEN** the system creates a DOM Document object
- **AND** all elements are accessible via standard DOM APIs

#### Scenario: Handle Inkscape namespaces
- **GIVEN** an SVG file with Inkscape-specific attributes (inkscape:label, sodipodi:nodetypes)
- **WHEN** the file is parsed
- **THEN** namespaced attributes are accessible via getAttribute()
- **AND** elements can be found by their inkscape:label value

#### Scenario: Handle malformed SVG
- **GIVEN** an SVG file with invalid XML syntax
- **WHEN** the file is parsed
- **THEN** the system throws a descriptive error
- **AND** the error indicates the parsing failure reason

### Requirement: Element Selection by ID or Label

The system SHALL find SVG elements by their `id` attribute or `inkscape:label` attribute.

#### Scenario: Find element by id
- **GIVEN** an SVG with `<circle id="insert" cx="100" cy="50"/>`
- **WHEN** searching for element with id "insert"
- **THEN** the circle element is returned
- **AND** its attributes are accessible

#### Scenario: Find element by inkscape:label
- **GIVEN** an SVG with `<path inkscape:label="prise" d="..."/>`
- **WHEN** searching for element with inkscape:label "prise"
- **THEN** the path element is returned

#### Scenario: Element not found
- **GIVEN** an SVG without an element with id "missing"
- **WHEN** searching for element with id "missing"
- **THEN** null is returned

### Requirement: Attribute Extraction

The system SHALL extract standard SVG attributes from elements using DOM APIs.

#### Scenario: Extract viewBox
- **GIVEN** an SVG with `viewBox="0 0 200 300"`
- **WHEN** extracting the viewBox
- **THEN** the system returns dimensions {width: 200, height: 300}

#### Scenario: Extract circle center
- **GIVEN** a circle element with `cx="150.5"` and `cy="75.25"`
- **WHEN** extracting the center point
- **THEN** the system returns {x: 150.5, y: 75.25}

#### Scenario: Extract transform attribute
- **GIVEN** an element with `transform="rotate(45) translate(10, 20)"`
- **WHEN** extracting the transform
- **THEN** the transform string "rotate(45) translate(10, 20)" is returned for further parsing

### Requirement: Element Cleaning

The system SHALL remove editor-specific attributes from elements while preserving visual attributes.

#### Scenario: Remove Inkscape attributes
- **GIVEN** an element with `inkscape:label="foo"` and `inkscape:connector-curvature="0"`
- **WHEN** the element is cleaned
- **THEN** all `inkscape:*` attributes are removed
- **AND** visual attributes (d, fill, transform) are preserved

#### Scenario: Remove Sodipodi attributes
- **GIVEN** an element with `sodipodi:nodetypes="ccc"`
- **WHEN** the element is cleaned
- **THEN** all `sodipodi:*` attributes are removed

#### Scenario: Remove id attributes
- **GIVEN** an element with `id="path123"`
- **WHEN** the element is cleaned for output
- **THEN** the `id` attribute is removed
- **AND** the element structure is preserved

### Requirement: Element Serialization

The system SHALL serialize cleaned DOM elements back to SVG strings for inclusion in output.

#### Scenario: Serialize path element
- **GIVEN** a cleaned path element with `d="M0,0 L100,100"`
- **WHEN** the element is serialized
- **THEN** the output is a valid SVG path string `<path d="M0,0 L100,100"/>`

#### Scenario: Serialize element with children
- **GIVEN** a text element with tspan children
- **WHEN** the element is serialized
- **THEN** the output includes the parent and all child elements

