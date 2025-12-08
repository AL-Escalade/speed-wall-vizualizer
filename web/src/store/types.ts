/**
 * Store types for the web application
 */

import type { WallConfig } from '@voie-vitesse/core';
import type { PanelSide } from '@/constants/routes';

/** Anchor position for custom placement */
export interface AnchorPosition {
  /** Panel side: 'SN' (gauche) or 'DX' (droit) */
  side: PanelSide;
  /** Column (A-L) */
  column: string;
  /** Row (1-10) */
  row: number;
}

/** A section (voie) in the configuration */
export interface Section {
  id: string;
  /** Display name for this section */
  name: string;
  /** Reference route source (e.g., "ifsc", "u15") */
  source: string;
  /** Lane index (0 = leftmost) */
  lane: number;
  /** First hold (1-based index or label) */
  fromHold: number | string;
  /** Last hold (1-based index or label) */
  toHold: number | string;
  /** Color for this section */
  color: string;
  /** Optional anchor position for custom placement */
  anchor?: AnchorPosition;
}

/** A saved configuration */
export interface SavedConfiguration {
  id: string;
  name: string;
  wall: WallConfig;
  sections: Section[];
  /** Show arrow indicators for hold orientation */
  showArrow?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Viewer state for zoom and pan */
export interface ViewerState {
  zoom: number;
  panX: number;
  panY: number;
}
