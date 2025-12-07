/**
 * Rotation calculation for hold orientation
 */
import type { Point, PanelId, InsertPosition } from './types.js';
/**
 * Calculate the angle from one point to another
 * @param from - Starting point
 * @param to - Target point
 * @returns Angle in degrees (0° = right, 90° = up, counterclockwise)
 */
export declare function calculateAngle(from: Point, to: Point): number;
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
export declare function calculateHoldRotation(positionPanel: PanelId, position: InsertPosition, orientationPanel: PanelId, orientation: InsertPosition, holdType: string, laneOffset?: number): number;
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
export declare function calculateRotation(panel: PanelId, position: InsertPosition, orientation: InsertPosition, holdType: string, laneOffset?: number): number;
//# sourceMappingURL=rotation.d.ts.map