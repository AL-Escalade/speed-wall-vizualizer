# web-app Spec Delta

## MODIFIED Requirements

### Requirement: Section Color Customization

The system SHALL allow users to customize each color declared by a section's
reference route, independently.

#### Scenario: Change section color
- **GIVEN** a section whose route declares one color
- **WHEN** the user selects a new color
- **THEN** all holds in that section display with the new color
- **AND** the SVG preview updates in real-time

#### Scenario: Default color
- **GIVEN** a new section is added
- **THEN** the section uses the reference route's colors with no override

#### Scenario: One picker per declared color
- **GIVEN** a section whose route declares several colors
- **WHEN** the section panel is expanded
- **THEN** one color picker is shown per declared color, in declaration order
- **AND** each picker is captioned with the translated name of its color tag

#### Scenario: Override a single color
- **GIVEN** a section whose route declares several colors
- **WHEN** the user changes one of them
- **THEN** only the holds carrying that color tag change
- **AND** the other colors keep following the reference route

#### Scenario: Reset to the route's colors
- **GIVEN** a section with at least one color override
- **WHEN** the user activates the reset control
- **THEN** all overrides are dropped
- **AND** the section follows the reference route's colors again

#### Scenario: Reset control visibility
- **GIVEN** a section with no color override
- **THEN** no reset control is offered

#### Scenario: Changing the source route
- **GIVEN** a section with color overrides
- **WHEN** the user selects a different reference route
- **THEN** the overrides are dropped, since color tags are route-specific

#### Scenario: Multi-color section indicator
- **GIVEN** a section resolving to several distinct colors
- **THEN** its header swatch shows each color as an equal band

## ADDED Requirements

### Requirement: Section Color Migration

The system SHALL migrate sections saved before reference routes could declare
several colors, identically at every entry point.

#### Scenario: Section that was never customized
- **GIVEN** a saved section whose stored color equals its route's pre-feature color
- **WHEN** the configuration is loaded
- **THEN** the section carries no color override
- **AND** it displays the route's current colors

#### Scenario: Section with a deliberate color
- **GIVEN** a saved section whose stored color differs from its route's pre-feature color
- **WHEN** the configuration is loaded
- **THEN** the stored color is preserved
- **AND** it is applied to every color tag of the route

#### Scenario: Case-insensitive comparison
- **GIVEN** a saved section storing "#ff0000" while its route declared "#FF0000"
- **WHEN** the configuration is loaded
- **THEN** the section is treated as never customized

#### Scenario: Idempotence
- **GIVEN** an already migrated configuration
- **WHEN** it is loaded again
- **THEN** its sections are unchanged

#### Scenario: Every entry point
- **WHEN** a configuration is rehydrated from localStorage, imported from a JSON
  file, or decoded from a shared link
- **THEN** the same migration is applied
- **AND** migration happens before duplicate detection, so an old shared link and
  its already migrated local twin still deduplicate

#### Scenario: Unknown source route
- **GIVEN** a saved section referencing a route that no longer exists
- **WHEN** the configuration is loaded
- **THEN** the section is marked migrated
- **AND** its stored color is left untouched
