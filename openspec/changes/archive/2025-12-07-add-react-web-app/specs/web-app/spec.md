# web-app Specification

## Purpose

Defines the React web application for visual configuration and viewing of climbing wall SVG images.

## ADDED Requirements

### Requirement: Configuration Management

The system SHALL allow users to create, select, and delete wall configurations.

#### Scenario: Create new configuration
- **GIVEN** the application is open
- **WHEN** the user clicks "New Configuration"
- **THEN** a new configuration is created with default values
- **AND** it becomes the active configuration
- **AND** it is saved to localStorage

#### Scenario: Select existing configuration
- **GIVEN** multiple configurations exist
- **WHEN** the user selects a configuration from the dropdown
- **THEN** that configuration becomes active
- **AND** the viewer updates to show the selected configuration

#### Scenario: Delete configuration
- **GIVEN** a configuration is selected
- **WHEN** the user clicks "Delete"
- **THEN** the configuration is removed from localStorage
- **AND** another configuration becomes active (or empty state if none left)

### Requirement: Wall Size Configuration

The system SHALL allow users to configure wall dimensions.

#### Scenario: Set number of lanes
- **GIVEN** a configuration is active
- **WHEN** the user changes the lanes input (1-4)
- **THEN** the wall width updates in real-time
- **AND** the SVG preview regenerates

#### Scenario: Set number of panels
- **GIVEN** a configuration is active
- **WHEN** the user changes the panels height input (1-15)
- **THEN** the wall height updates in real-time
- **AND** the SVG preview regenerates

### Requirement: Section Management

The system SHALL allow users to add, modify, and remove sections (route segments).

#### Scenario: Add section from reference route
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Add Section" and selects a reference route
- **THEN** a new section is added with all holds from that route
- **AND** the section appears in the section list
- **AND** the SVG preview updates

#### Scenario: Set section start hold
- **GIVEN** a section exists
- **WHEN** the user selects a start hold from the dropdown
- **THEN** the section displays only holds from that point onward
- **AND** the SVG preview updates in real-time

#### Scenario: Set section end hold
- **GIVEN** a section exists
- **WHEN** the user selects an end hold from the dropdown
- **THEN** the section displays only holds up to that point
- **AND** the SVG preview updates in real-time

#### Scenario: Delete section
- **GIVEN** a section exists
- **WHEN** the user clicks the delete button on a section
- **THEN** the section is removed
- **AND** the SVG preview updates

### Requirement: Section Color Customization

The system SHALL allow users to customize section colors.

#### Scenario: Change section color
- **GIVEN** a section exists
- **WHEN** the user selects a new color
- **THEN** all holds in that section display with the new color
- **AND** the SVG preview updates in real-time

#### Scenario: Default color
- **GIVEN** a new section is added
- **THEN** the section uses the reference route's default color

### Requirement: Lane Assignment

The system SHALL allow users to assign sections to lanes.

#### Scenario: Assign via dropdown
- **GIVEN** a section exists
- **WHEN** the user selects a lane (SN/DX) from the dropdown
- **THEN** the section is positioned on that lane
- **AND** the SVG preview updates

#### Scenario: Assign via click
- **GIVEN** the user is adding a section
- **WHEN** the user clicks on a lane in the viewer
- **THEN** the section is assigned to the clicked lane

### Requirement: SVG Viewer Navigation

The system SHALL provide zoom and pan navigation for the SVG viewer.

#### Scenario: Zoom with mouse wheel
- **GIVEN** the viewer is displayed
- **WHEN** the user scrolls the mouse wheel
- **THEN** the view zooms in/out centered on the cursor position

#### Scenario: Zoom with buttons
- **GIVEN** the viewer is displayed
- **WHEN** the user clicks the +/- buttons
- **THEN** the view zooms in/out centered on the viewport

#### Scenario: Pan with drag
- **GIVEN** the viewer is displayed
- **WHEN** the user clicks and drags
- **THEN** the view pans in the drag direction

#### Scenario: Reset zoom
- **GIVEN** the view is zoomed/panned
- **WHEN** the user clicks "Reset"
- **THEN** the view returns to fit the entire wall

### Requirement: Birdview Navigation

The system SHALL provide a minimap for quick navigation.

#### Scenario: Display birdview
- **GIVEN** the viewer is displayed
- **THEN** a small minimap shows the entire wall
- **AND** a rectangle indicates the current viewport

#### Scenario: Navigate via birdview
- **GIVEN** the birdview is displayed
- **WHEN** the user clicks on a position in the birdview
- **THEN** the main view centers on that position

### Requirement: Hold Selection by Click

The system SHALL allow selecting holds by clicking in the viewer.

#### Scenario: Select start hold by click
- **GIVEN** the user is editing a section's start hold
- **WHEN** the user clicks on a hold in the viewer
- **THEN** that hold becomes the section's start hold
- **AND** the SVG preview updates

#### Scenario: Navigate holds with arrows
- **GIVEN** a hold is selected
- **WHEN** the user presses arrow keys
- **THEN** the selection moves to the adjacent hold
- **AND** the SVG preview updates

### Requirement: Export Functionality

The system SHALL allow exporting configurations and images.

#### Scenario: Export JSON
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Export JSON"
- **THEN** a JSON file is downloaded with the full configuration

#### Scenario: Import JSON
- **GIVEN** the application is open
- **WHEN** the user imports a JSON file
- **THEN** a new configuration is created from the file
- **AND** it becomes the active configuration

#### Scenario: Export SVG
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Export SVG"
- **THEN** an SVG file is downloaded with the current wall image

### Requirement: Auto-save

The system SHALL automatically persist configurations.

#### Scenario: Auto-save on change
- **GIVEN** a configuration is active
- **WHEN** the user makes any change
- **THEN** the change is automatically saved to localStorage

#### Scenario: Restore on load
- **GIVEN** configurations exist in localStorage
- **WHEN** the application loads
- **THEN** all configurations are restored
- **AND** the last active configuration is selected
