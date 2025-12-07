/**
 * Selection store for interactive hold selection
 */

import { create } from 'zustand';

/** Selection mode */
export type SelectionMode = 'from' | 'to' | null;

interface SelectionState {
  /** Current selection mode */
  mode: SelectionMode;
  /** ID of section being edited */
  sectionId: string | null;

  // Actions
  /** Start selecting a hold for fromHold */
  startSelectFrom: (sectionId: string) => void;
  /** Start selecting a hold for toHold */
  startSelectTo: (sectionId: string) => void;
  /** Clear/cancel selection - resets selection state */
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  mode: null,
  sectionId: null,

  startSelectFrom: (sectionId: string) => {
    set({ mode: 'from', sectionId });
  },

  startSelectTo: (sectionId: string) => {
    set({ mode: 'to', sectionId });
  },

  clearSelection: () => {
    set({ mode: null, sectionId: null });
  },
}));
