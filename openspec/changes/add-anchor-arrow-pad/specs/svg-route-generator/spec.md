## ADDED Requirements

### Requirement: Anchor position supports virtual columns and rows
The route composition system SHALL accept virtual column values (`A-1`, `K+1`) and virtual row values (`0`, `11`) in `AnchorPosition`, and compute correct mm offsets for these positions.

#### Scenario: Anchor at virtual column A-1
- **WHEN** a route segment has anchor with column `A-1`, row `5`, panel `SN1`
- **THEN** `calculateMmOffset` SHALL compute the anchor X position as one column-spacing to the left of column A
- **AND** the offset SHALL be applied to all holds in the segment

#### Scenario: Anchor at virtual column K+1
- **WHEN** a route segment has anchor with column `K+1`, row `5`, panel `SN1`
- **THEN** `calculateMmOffset` SHALL compute the anchor X position as one column-spacing to the right of column K
- **AND** the offset SHALL be applied to all holds in the segment

#### Scenario: Anchor at virtual row 0
- **WHEN** a route segment has anchor with column `F`, row `0`, panel `SN1`
- **THEN** `calculateMmOffset` SHALL compute the anchor Y position as one row-spacing below row 1
- **AND** the offset SHALL be applied to all holds in the segment

#### Scenario: Anchor at virtual row 11
- **WHEN** a route segment has anchor with column `F`, row `11`, panel `SN1`
- **THEN** `calculateMmOffset` SHALL compute the anchor Y position as one row-spacing above row 10
- **AND** the offset SHALL be applied to all holds in the segment

#### Scenario: Anchor at physical position unchanged
- **WHEN** a route segment has anchor with column `F`, row `5`, panel `SN1`
- **THEN** `calculateMmOffset` SHALL produce the same result as before this change
