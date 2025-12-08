# web-arrow-toggle Specification Delta

## Target Spec
web-app

## ADDED Requirements

### Requirement: Arrow Display Toggle
The system SHALL allow users to toggle the display of arrow indicators in the SVG viewer.

#### Scenario: Toggle arrow display on
- **GIVEN** a configuration is active
- **WHEN** the user enables "Afficher les flèches"
- **THEN** arrow indicators appear for each hold in the SVG
- **AND** the setting is saved to the configuration

#### Scenario: Toggle arrow display off
- **GIVEN** arrow display is enabled
- **WHEN** the user disables "Afficher les flèches"
- **THEN** arrow indicators are hidden in the SVG
- **AND** the setting is saved to the configuration

#### Scenario: Arrow setting persistence
- **GIVEN** a configuration with arrow display enabled
- **WHEN** the application reloads
- **THEN** the arrow display remains enabled
- **AND** arrows are visible in the SVG viewer

#### Scenario: Default arrow setting
- **GIVEN** a new configuration is created
- **THEN** arrow display is disabled by default

### Requirement: Arrow Toggle UI Location
The system SHALL display the arrow toggle in the wall configuration section.

#### Scenario: Arrow toggle placement
- **GIVEN** the sidebar is displayed
- **THEN** a checkbox "Afficher les flèches" appears in the wall size configuration section
- **AND** it is positioned after the wall dimension controls
