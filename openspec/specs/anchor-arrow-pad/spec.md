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

### Requirement: Arrow buttons disabled at absolute wall limits
The directional arrow buttons SHALL be disabled when the anchor is at the absolute limit of the wall (considering cross-panel wrapping and lane navigation).

#### Scenario: Up arrow disabled at maximum row
- **WHEN** the current anchor row is 11 (virtual maximum)
- **THEN** the ▲ button SHALL be disabled

#### Scenario: Down arrow disabled at minimum row
- **WHEN** the current anchor row is 0 (virtual minimum)
- **THEN** the ▼ button SHALL be disabled

#### Scenario: Right arrow wraps cross-panel within a lane
- **WHEN** the current anchor column is K+1 on the SN panel
- **AND** the user clicks the ► button
- **THEN** the anchor wraps to column A on the DX panel (same lane)

#### Scenario: Right arrow wraps cross-lane
- **WHEN** the current anchor column is K+1 on the DX panel
- **AND** the lane change callback is available and the current lane is not the last
- **AND** the user clicks the ► button
- **THEN** the anchor wraps to column A on the SN panel of the next lane

#### Scenario: Right arrow disabled at absolute wall limit
- **WHEN** the current anchor column is K+1 on the DX panel
- **AND** the current lane is the last lane (or lane navigation is unavailable)
- **THEN** the ► button SHALL be disabled

#### Scenario: Left arrow wraps cross-panel within a lane
- **WHEN** the current anchor column is A-1 on the DX panel
- **AND** the user clicks the ◄ button
- **THEN** the anchor wraps to column K on the SN panel (same lane)

#### Scenario: Left arrow wraps cross-lane
- **WHEN** the current anchor column is A-1 on the SN panel
- **AND** the lane change callback is available and the current lane is not the first
- **AND** the user clicks the ◄ button
- **THEN** the anchor wraps to column K on the DX panel of the previous lane

#### Scenario: Left arrow disabled at absolute wall limit
- **WHEN** the current anchor column is A-1 on the SN panel
- **AND** the current lane is the first lane (or lane navigation is unavailable)
- **THEN** the ◄ button SHALL be disabled

#### Scenario: Arrows enabled at non-limit positions
- **WHEN** the current anchor column is F and row is 5
- **THEN** all four arrow buttons SHALL be enabled

### Requirement: Panel navigation buttons
When multiple lanes are available AND lane change callback is provided, dedicated previous/next panel buttons (double chevrons ⟪ ⟫) SHALL be displayed alongside the arrow pad.

#### Scenario: Previous panel within same lane
- **WHEN** the current panel side is DX
- **AND** the user clicks the ⟪ button
- **THEN** the panel side changes to SN (same lane)

#### Scenario: Previous panel cross-lane
- **WHEN** the current panel side is SN
- **AND** the current lane is not the first
- **AND** the user clicks the ⟪ button
- **THEN** the panel side changes to DX and the lane decrements

#### Scenario: Next panel within same lane
- **WHEN** the current panel side is SN
- **AND** the user clicks the ⟫ button
- **THEN** the panel side changes to DX (same lane)

#### Scenario: Next panel cross-lane
- **WHEN** the current panel side is DX
- **AND** the current lane is not the last
- **AND** the user clicks the ⟫ button
- **THEN** the panel side changes to SN and the lane increments

#### Scenario: Panel buttons hidden without lane navigation
- **WHEN** the lane change callback is not provided or there is only one lane
- **THEN** the ⟪ and ⟫ buttons SHALL NOT be displayed

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
