import { create } from 'zustand';
import type { OverlayType } from '../types/ui.types';

interface UIState {
  // Active overlay (null means all closed)
  activeOverlay: OverlayType | null;
  
  // Actions
  openOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: OverlayType) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeOverlay: null,

  openOverlay: (overlay) => {
    set({ activeOverlay: overlay });
  },

  closeOverlay: () => {
    set({ activeOverlay: null });
  },

  toggleOverlay: (overlay) => {
    const current = get().activeOverlay;
    set({ activeOverlay: current === overlay ? null : overlay });
  },
}));
