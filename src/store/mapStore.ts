// src/store/mapStore.ts
import { create } from 'zustand';

// Описываем, какие данные и функции будет содержать наш стор
interface MapState {
  // Состояние карты
  map: mapboxgl.Map | null;
  isMapLoaded: boolean;

  // Состояние пользователя
  avatarPosition: number[] | null;
  bearing: number;
  isInitialFlightDone: boolean;

  // Действия (функции для изменения состояния)
  setMap: (map: mapboxgl.Map | null) => void;
  setAvatarPosition: (coords: number[] | null) => void;
  setBearing: (bearing: number) => void;
  completeInitialFlight: () => void;
  resetCamera: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  // Начальные значения
  map: null,
  isMapLoaded: false,
  avatarPosition: null,
  bearing: 0,
  isInitialFlightDone: false,
  
  // Реализация действий
  setMap: (mapInstance) => set({ 
    map: mapInstance, 
    isMapLoaded: !!mapInstance // true если mapInstance не null, иначе false
  }),
  setAvatarPosition: (coords) => {
    set({ avatarPosition: coords });
  },
  setBearing: (b) => set({ bearing: b }),
  completeInitialFlight: () => set({ isInitialFlightDone: true }),
  resetCamera: () => set({ isInitialFlightDone: false }), // Сбрасываем флаг для повторного "прилета"
}));