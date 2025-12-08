## ADDED Requirements

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

## MODIFIED Requirements

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
