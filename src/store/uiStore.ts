import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OverlayType } from '../types/ui.types';

interface UIState {
  // Active overlay (null means all closed)
  activeOverlay: OverlayType | null;

  // Map style theme (light or dark)
  mapStyleTheme: 'light' | 'dark';

  // Active map style ID (persisted)
  activeStyleId: string;

  // Map style loading state
  isMapStyleLoading: boolean;

  // Actions
  openOverlay: (overlay: OverlayType) => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: OverlayType) => void;
  setMapStyleTheme: (theme: 'light' | 'dark') => void;
  setActiveStyleId: (id: string) => void;
  setMapStyleLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      activeOverlay: null,
      mapStyleTheme: 'dark', // По умолчанию тёмная тема
      activeStyleId: 'dark', // Default to dark style
      isMapStyleLoading: false,

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

      setMapStyleLoading: (loading) => {
        set({ isMapStyleLoading: loading });
      },
    }),
    {
      name: 'qdam-ui-settings',
      partialize: (state) => ({
        mapStyleTheme: state.mapStyleTheme,
        activeStyleId: state.activeStyleId,
      }),
    }
  )
);
