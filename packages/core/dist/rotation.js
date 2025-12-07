/**
 * Rotation calculation for hold orientation
 */
import { getInsertPosition } from './plate-grid.js';
import { getHoldDefaultOrientation } from './hold-svg-parser.js';
/**
 * Calculate the angle from one point to another
 * @param from - Starting point
 * @param to - Target point
 * @returns Angle in degrees (0° = right, 90° = up, counterclockwise)
 */
export function calculateAngle(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // atan2 returns angle in radians, convert to degrees
    // Positions are in wall coordinates (Y increases upward)
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI);
    // Normalize to 0-360
    if (degrees < 0) {
        degrees += 360;
    }
    return degrees;
}
/**
 * Calculate the rotation angle for a hold based on its orientation
 * @param positionPanel - Panel of the hold position
 * @param position - Insert position of the hold
 * @param orientationPanel - Panel of the orientation target (may differ from position panel)
 * @param orientation - Insert position of the orientation target
 * @param holdType - Type of hold (BIG, FOOT, etc.)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns Rotation angle in degrees to apply to the SVG
 */
export function calculateHoldRotation(positionPanel, position, orientationPanel, orientation, holdType, laneOffset = 0) {
    // Get absolute positions
    const fromPos = getInsertPosition(positionPanel, position, laneOffset);
    const toPos = getInsertPosition(orientationPanel, orientation, laneOffset);
    // Calculate target angle (where the arrow should point)
    const targetAngle = calculateAngle(fromPos, toPos);
    // Get default orientation for this hold type from configuration
    const defaultAngle = getHoldDefaultOrientation(holdType);
    // Calculate rotation needed: how much to rotate from default to target
    let rotation = targetAngle - defaultAngle;
    // Normalize to -180 to 180
    while (rotation > 180)
        rotation -= 360;
    while (rotation < -180)
        rotation += 360;
    return rotation;
}
/**
 * Calculate rotation for a hold with same panel for position and orientation
 * This is a simplified version for most common cases
 * @param panel - Panel identifier
 * @param position - Insert position of the hold
 * @param orientation - Insert position of the orientation target
 * @param holdType - Type of hold (BIG, FOOT, etc.)
 * @param laneOffset - Lane offset (0 = leftmost lane). Default: 0
 * @returns Rotation angle in degrees
 */
export function calculateRotation(panel, position, orientation, holdType, laneOffset = 0) {
    return calculateHoldRotation(panel, position, panel, orientation, holdType, laneOffset);
}
//# sourceMappingURL=rotation.js.map