import { create } from 'zustand';
import type { OverlayType } from '../types/ui.types';

interface UIState {
  // Active overlay (null means all closed)
  activeOverlay: OverlayType | null;

  // Map style theme (light or dark)
  mapStyleTheme: 'light' | 'dark';

  // Active map style ID (persisted)
  activeStyleId: string;

  // Actions
  openOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: OverlayType) => void;
  setMapStyleTheme: (theme: 'light' | 'dark') => void;
  setActiveStyleId: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeOverlay: null,
  mapStyleTheme: 'dark', // По умолчанию тёмная тема
  activeStyleId: 'dark', // Default to dark style

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

  setMapStyleTheme: (theme) => {
    set({ mapStyleTheme: theme });
  },

  setActiveStyleId: (id) => {
    set({ activeStyleId: id });
  },
}));
