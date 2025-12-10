# web-app Specification

## Purpose
TBD - created by archiving change add-react-web-app. Update Purpose after archive.
## Requirements
### Requirement: Configuration Management

The system SHALL allow users to create, select, rename, and delete wall configurations.

#### Scenario: First load with no configuration
- **GIVEN** the application loads for the first time
- **WHEN** no configuration exists in localStorage
- **THEN** a default configuration is created with IFSC route on both lanes
- **AND** it becomes the active configuration

#### Scenario: Rename configuration
- **GIVEN** a configuration is active
- **WHEN** the user edits the configuration name
- **THEN** the name is updated
- **AND** the change is saved to localStorage

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

The system SHALL allow users to configure wall dimensions with French labels.

#### Scenario: Set number of lanes (Largeur)
- **GIVEN** a configuration is active
- **WHEN** the user changes the "Largeur (couloirs)" input (1-4)
- **THEN** the wall width updates in real-time
- **AND** the SVG preview regenerates

#### Scenario: Set number of panels (Hauteur)
- **GIVEN** a configuration is active
- **WHEN** the user changes the "Hauteur (panneaux)" input (1-15)
- **THEN** the wall height updates in real-time
- **AND** the SVG preview regenerates

### Requirement: Section Management

The system SHALL allow users to add, modify, and remove sections using hold labels.

#### Scenario: Add section from reference route
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Add Section" and selects a reference route
- **THEN** a new section is added with all holds from that route
- **AND** the first and last hold labels are auto-selected
- **AND** the section appears in the section list
- **AND** the SVG preview updates

#### Scenario: Set section start hold (Prise de départ)
- **GIVEN** a section exists
- **WHEN** the user selects a start hold label from the dropdown
- **THEN** the section displays only holds from that point onward
- **AND** the SVG preview updates in real-time

#### Scenario: Set section end hold (Prise d'arrivée)
- **GIVEN** a section exists
- **WHEN** the user selects an end hold label from the dropdown
- **THEN** the section displays only holds up to that point
- **AND** the SVG preview updates in real-time

#### Scenario: Change source route
- **GIVEN** a section exists
- **WHEN** the user selects a different source route
- **THEN** the first and last hold labels of the new route are auto-selected
- **AND** the SVG preview updates

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

The system SHALL provide zoom and pan navigation that persists across configuration changes.

#### Scenario: Zoom with mouse wheel
- **GIVEN** the viewer is displayed on desktop
- **WHEN** the user scrolls the mouse wheel
- **THEN** the view zooms in/out centered on the cursor position

#### Scenario: Zoom with buttons
- **GIVEN** the viewer is displayed
- **WHEN** the user clicks/taps the +/- buttons
- **THEN** the view zooms in/out centered on the viewport

#### Scenario: Pan with drag (desktop)
- **GIVEN** the viewer is displayed on desktop
- **WHEN** the user clicks and drags with mouse
- **THEN** the view pans in the drag direction

#### Scenario: Pan with two-finger drag (mobile)
- **GIVEN** the viewer is displayed on a touch device
- **WHEN** the user drags with two fingers
- **THEN** the view pans in the drag direction

#### Scenario: Reset zoom
- **GIVEN** the view is zoomed/panned
- **WHEN** the user clicks/taps "Reset" (Home button) or double-taps (mobile)
- **THEN** the view returns to fit the entire wall

#### Scenario: Preserve zoom on config change
- **GIVEN** the viewer has a specific zoom/pan state
- **WHEN** the user modifies the configuration
- **THEN** the zoom and pan are preserved
- **AND** only the SVG content updates

### Requirement: Birdview Navigation

The system SHALL provide a minimap showing the entire wall with drag navigation.

#### Scenario: Display birdview
- **GIVEN** the viewer is displayed on desktop OR on the "Mur" tab on mobile
- **THEN** a small minimap shows the entire wall (properly scaled)
- **AND** a rectangle indicates the current viewport

#### Scenario: Navigate via birdview drag
- **GIVEN** the birdview is displayed
- **WHEN** the user drags the viewport rectangle (mouse or touch)
- **THEN** the main view follows the drag movement in real-time

#### Scenario: Navigate via birdview click/tap
- **GIVEN** the birdview is displayed
- **WHEN** the user clicks/taps on a position in the birdview
- **THEN** the main view centers on that position

#### Scenario: Hide birdview on very small screens
- **GIVEN** the screen width is less than 400px
- **THEN** the birdview minimap is hidden to maximize viewer space

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

The system SHALL allow exporting configurations and images with French labels.

#### Scenario: Download configuration
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Télécharger la configuration"
- **THEN** a JSON file is downloaded with the full configuration

#### Scenario: Import configuration
- **GIVEN** the application is open
- **WHEN** the user clicks "Importer la configuration" and selects a JSON file
- **THEN** a new configuration is created from the file
- **AND** it becomes the active configuration

#### Scenario: Export SVG
- **GIVEN** a configuration is active
- **WHEN** the user clicks "Exporter SVG"
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

### Requirement: Reference Routes Display

The system SHALL display reference routes with French names.

#### Scenario: Display route names
- **GIVEN** the route selector is displayed
- **THEN** "Training" is displayed as "Combinaison voie U15 et IFSC"
- **AND** other routes keep their original names (IFSC, U11-U13, U15)

### Requirement: Coordinate Display System Selection

The system SHALL allow users to select the coordinate system used for displaying column labels on the grid.

#### Scenario: Display coordinate system selector
- **GIVEN** the configuration panel is displayed
- **THEN** a selector shows the available coordinate systems: ABC, FFME, IFSC
- **AND** the default selection is ABC

#### Scenario: Select ABC coordinate system
- **WHEN** the user selects "ABC" coordinate system
- **THEN** the grid displays columns as A, B, C, D, E, F, G, H, I, J, K (11 columns)
- **AND** the preference is saved to the configuration

#### Scenario: Select FFME coordinate system
- **WHEN** the user selects "FFME" coordinate system
- **THEN** the grid displays columns as A, B, C, D, E, F, G, H, I, K, L (11 columns, no J)
- **AND** the preference is saved to the configuration

#### Scenario: Select IFSC coordinate system
- **WHEN** the user selects "IFSC" coordinate system
- **THEN** the grid displays columns as A, B, C, D, E, F, G, H, I, L, M (11 columns, no J/K)
- **AND** the preference is saved to the configuration

#### Scenario: Persist coordinate display preference
- **GIVEN** a coordinate display system is selected
- **WHEN** the page is reloaded
- **THEN** the previously selected coordinate system is restored

### Requirement: Mobile Tab Navigation

The system SHALL provide tab-based navigation on mobile devices (screen width < 768px).

#### Scenario: Display bottom tab bar on mobile
- **GIVEN** the application is viewed on a mobile device
- **WHEN** the screen width is less than 768px
- **THEN** a bottom tab bar is displayed with "Configuration" and "Mur" tabs
- **AND** the current tab is visually highlighted

#### Scenario: Switch to Configuration tab
- **GIVEN** the user is on the "Mur" tab
- **WHEN** the user taps the "Configuration" tab
- **THEN** the full configuration view (sidebar content) is displayed
- **AND** the viewer is hidden

#### Scenario: Switch to Mur tab
- **GIVEN** the user is on the "Configuration" tab
- **WHEN** the user taps the "Mur" tab
- **THEN** the SVG viewer is displayed full screen
- **AND** the configuration panel is hidden

#### Scenario: Preserve state when switching tabs
- **GIVEN** the user has made changes in the Configuration tab
- **WHEN** the user switches to the Mur tab and back
- **THEN** all configuration changes are preserved
- **AND** the scroll position is maintained

### Requirement: Mobile Header Adaptation

The system SHALL adapt the header for mobile screens.

#### Scenario: Display compact header on mobile
- **GIVEN** the application is viewed on a mobile device
- **WHEN** the screen width is less than 768px
- **THEN** action buttons are grouped in a dropdown menu
- **AND** only the app title and menu button are visible in the header

#### Scenario: Access actions via dropdown menu
- **GIVEN** the user is on a mobile device
- **WHEN** the user taps the menu button (hamburger or dots icon)
- **THEN** a dropdown menu appears with all available actions
- **AND** actions include: Partager, Exporter, Importer, Télécharger SVG, Imprimer

#### Scenario: Close dropdown after action
- **GIVEN** the dropdown menu is open
- **WHEN** the user taps an action or outside the menu
- **THEN** the dropdown menu closes

### Requirement: Touch Gestures for Viewer

The system SHALL support touch gestures for viewer navigation on mobile devices.

#### Scenario: Pinch to zoom
- **GIVEN** the viewer is displayed on a touch device
- **WHEN** the user performs a pinch gesture with two fingers
- **THEN** the view zooms in or out centered on the pinch point

#### Scenario: Two-finger pan
- **GIVEN** the viewer is displayed on a touch device
- **WHEN** the user drags with two fingers
- **THEN** the view pans in the drag direction

#### Scenario: Single finger does not pan viewer
- **GIVEN** the viewer is displayed on a touch device
- **WHEN** the user drags with one finger
- **THEN** the view does NOT pan
- **AND** normal page scroll behavior is preserved if applicable

#### Scenario: Double tap to reset zoom
- **GIVEN** the viewer is zoomed or panned
- **WHEN** the user double-taps on the viewer
- **THEN** the view resets to fit the entire wall

### Requirement: Mobile Configuration View

The system SHALL display the configuration panel as a full-screen view on mobile.

#### Scenario: Full-screen configuration on mobile
- **GIVEN** the user is on the "Configuration" tab on mobile
- **THEN** the configuration panel (ConfigSelector, WallConfig, SectionList, DisplayOptions) fills the entire screen
- **AND** the content is scrollable

#### Scenario: Section cards are full-width
- **GIVEN** the user is viewing sections on mobile
- **THEN** section cards expand to full width
- **AND** form inputs are appropriately sized for touch

