## ADDED Requirements

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
