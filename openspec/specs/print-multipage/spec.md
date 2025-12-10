# print-multipage Specification

## Purpose
TBD - created by archiving change add-print-multipage. Update Purpose after archive.
## Requirements
### Requirement: Print Page Navigation
The system SHALL provide a dedicated print page accessible from the main view.

#### Scenario: Access print page
- **GIVEN** the user is on the main view
- **WHEN** clicking the "Imprimer" button in the header
- **THEN** the print page is displayed

#### Scenario: Return to main view
- **GIVEN** the user is on the print page
- **WHEN** clicking the back button
- **THEN** the main view is displayed

### Requirement: Print Mode Selection
The system SHALL support two print modes: full wall and lane by lane.

#### Scenario: Full wall mode
- **GIVEN** the user is on the print page
- **WHEN** selecting "Mur complet" mode
- **THEN** the preview shows the entire wall split across pages

#### Scenario: Lane by lane mode
- **GIVEN** the user is on the print page
- **WHEN** selecting "Couloir par couloir" mode
- **THEN** the preview shows each lane (SNx + DXx pair) split across pages sequentially

### Requirement: Print Orientation Configuration
The system SHALL allow configuring page orientation with portrait as default.

#### Scenario: Default orientation
- **WHEN** opening the print page
- **THEN** portrait orientation is selected by default

#### Scenario: Change to landscape
- **GIVEN** the user is on the print page
- **WHEN** selecting landscape orientation
- **THEN** the preview updates to show landscape pages (297mm × 210mm)

### Requirement: Page Count Configuration
The system SHALL allow configuring the number of pages in height, with width adapting proportionally.

#### Scenario: Configure pages in height
- **GIVEN** the user is on the print page
- **WHEN** setting the number of pages in height to N
- **THEN** the width is calculated to maintain aspect ratio
- **AND** the preview updates to show the resulting grid

### Requirement: Overlap Configuration
The system SHALL allow configuring overlap between adjacent pages.

#### Scenario: Configure overlap
- **GIVEN** the user is on the print page
- **WHEN** setting the overlap value to X mm
- **THEN** adjacent pages share X mm of content
- **AND** the preview reflects the overlap

### Requirement: Print Preview Grid
The system SHALL display a grid of page thumbnails showing the cutting layout.

#### Scenario: Display page grid
- **GIVEN** a print configuration is set
- **WHEN** viewing the print page
- **THEN** a grid of miniature pages is displayed
- **AND** the grid shows how the content is split across pages

#### Scenario: Select page in grid
- **GIVEN** the page grid is displayed
- **WHEN** clicking on a page thumbnail
- **THEN** that page is selected and highlighted

### Requirement: Print Preview Detail
The system SHALL display a detailed view of the selected page.

#### Scenario: Display page detail
- **GIVEN** a page is selected in the grid
- **WHEN** viewing the detail area
- **THEN** the selected page content is displayed at larger size
- **AND** the content matches what will be exported

### Requirement: PDF Export
The system SHALL generate a multi-page PDF file client-side.

#### Scenario: Export full wall PDF
- **GIVEN** full wall mode is selected
- **WHEN** clicking "Exporter PDF"
- **THEN** a PDF file is downloaded
- **AND** the PDF contains all pages of the wall

#### Scenario: Export lane by lane PDF
- **GIVEN** lane by lane mode is selected
- **WHEN** clicking "Exporter PDF"
- **THEN** a PDF file is downloaded
- **AND** the PDF contains all lanes sequentially (lane 1 pages, then lane 2 pages, etc.)

### Requirement: PDF Page Content
The system SHALL include metadata on each PDF page.

#### Scenario: Page metadata
- **GIVEN** a PDF is generated
- **WHEN** viewing any page
- **THEN** the configuration name is displayed
- **AND** the export date is displayed

### Requirement: Print Margins
The system SHALL apply print margins to avoid content being cut by printers.

#### Scenario: Print margins applied
- **GIVEN** a PDF is generated
- **WHEN** viewing the page content
- **THEN** margins are applied around the content
- **AND** the content does not extend to the page edges

