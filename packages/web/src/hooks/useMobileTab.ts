/**
 * Hook to manage mobile tab navigation state
 */

import { create } from 'zustand';

export type MobileTab = 'config' | 'viewer';

interface MobileTabState {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

export const useMobileTab = create<MobileTabState>((set) => ({
  activeTab: 'config',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
