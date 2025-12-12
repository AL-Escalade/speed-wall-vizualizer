# web-app Spec Delta

## ADDED Requirements

### Requirement: Smearing Zone Visibility Toggle

The system SHALL allow users to show or hide smearing zones in the viewer.

#### Scenario: Display smearing zone toggle
- **GIVEN** the display options section is visible
- **THEN** a checkbox labeled "Zones d'adhérence" is displayed
- **AND** the checkbox is checked by default

#### Scenario: Toggle smearing zones off
- **GIVEN** smearing zones are visible
- **WHEN** the user unchecks the "Zones d'adhérence" checkbox
- **THEN** all smearing zones are hidden from the viewer
- **AND** the SVG preview updates in real-time

#### Scenario: Toggle smearing zones on
- **GIVEN** smearing zones are hidden
- **WHEN** the user checks the "Zones d'adhérence" checkbox
- **THEN** all smearing zones are shown in the viewer
- **AND** the SVG preview updates in real-time

#### Scenario: Smearing zone state is session-only
- **GIVEN** the user has changed the smearing zone visibility
- **WHEN** the page is reloaded
- **THEN** smearing zones visibility returns to default (visible)
- **AND** the setting is not persisted in localStorage or configuration

#### Scenario: Smearing zones visible by default on new session
- **GIVEN** the application loads for the first time
- **THEN** the "Zones d'adhérence" checkbox is checked
- **AND** smearing zones are visible in the viewer
