# anchor-arrow-pad Specification

## Purpose
Provides a cross-shaped directional arrow pad UI component for intuitive anchor positioning, allowing users to move the anchor position by one grid step per click in any cardinal direction.

## Requirements
### Requirement: Directional arrow pad for anchor positioning
The AnchorConfigurator component SHALL display a cross-shaped directional pad (▲ ▼ ◄ ►) below the existing side/column/row select fields, allowing the user to move the anchor position by one grid step per click.

#### Scenario: Move anchor up by one row
- **WHEN** the current anchor row is 5
- **AND** the user clicks the ▲ button
- **THEN** the anchor row is updated to 6

#### Scenario: Move anchor down by one row
- **WHEN** the current anchor row is 5
- **AND** the user clicks the ▼ button
- **THEN** the anchor row is updated to 4

#### Scenario: Move anchor right by one column
- **WHEN** the current anchor column is F (in active coordinate system)
- **AND** the user clicks the ► button
- **THEN** the anchor column is updated to G (next column in active coordinate system)

#### Scenario: Move anchor left by one column
- **WHEN** the current anchor column is F (in active coordinate system)
- **AND** the user clicks the ◄ button
- **THEN** the anchor column is updated to E (previous column in active coordinate system)

### Requirement: Arrow buttons disabled at grid limits
The directional arrow buttons SHALL be disabled when the anchor is at the limit of the extended grid (including virtual positions).

#### Scenario: Up arrow disabled at maximum row
- **WHEN** the current anchor row is 11 (virtual maximum)
- **THEN** the ▲ button SHALL be disabled

#### Scenario: Down arrow disabled at minimum row
- **WHEN** the current anchor row is 0 (virtual minimum)
- **THEN** the ▼ button SHALL be disabled

#### Scenario: Right arrow disabled at last column
- **WHEN** the current anchor column is K+1 in ABC system (virtual maximum)
- **THEN** the ► button SHALL be disabled

#### Scenario: Left arrow disabled at first column
- **WHEN** the current anchor column is A-1 (virtual minimum)
- **THEN** the ◄ button SHALL be disabled

#### Scenario: Arrows enabled at non-limit positions
- **WHEN** the current anchor column is F and row is 5
- **THEN** all four arrow buttons SHALL be enabled

### Requirement: Arrow pad navigates into virtual positions
The directional arrows SHALL allow navigation into and out of virtual positions seamlessly.

#### Scenario: Navigate from first physical column to virtual column
- **WHEN** the current anchor column is A
- **AND** the user clicks the ◄ button
- **THEN** the anchor column is updated to A-1

#### Scenario: Navigate from virtual column back to physical column
- **WHEN** the current anchor column is A-1
- **AND** the user clicks the ► button
- **THEN** the anchor column is updated to A

#### Scenario: Navigate from last physical column to virtual column
- **WHEN** the current anchor column is K (in ABC system)
- **AND** the user clicks the ► button
- **THEN** the anchor column is updated to K+1

#### Scenario: Navigate from row 1 to virtual row 0
- **WHEN** the current anchor row is 1
- **AND** the user clicks the ▼ button
- **THEN** the anchor row is updated to 0

#### Scenario: Navigate from row 10 to virtual row 11
- **WHEN** the current anchor row is 10
- **AND** the user clicks the ▲ button
- **THEN** the anchor row is updated to 11
