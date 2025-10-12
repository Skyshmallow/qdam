// src/types/index.ts

/**
 * Описывает игровую Базу
 */
export interface Base {
  id: number;
  coordinates: number[];
  status: 'new' | 'established'; // 'new' для анимации, 'established' - обычное состояние
}

/**
 * Описывает возможные состояния отслеживания
 */
export type TrackingState = 'idle' | 'recording' | 'paused';

/**
 * Props для компонента Map
 */
export interface MapProps {
  // Data to display
  avatarPosition: number[] | null;
  bearing: number; 
  simulatableRoute: number[][] | null;
  currentPath: number[][];
  routeWaypoints: number[][];
  bases: Base[];
  spheres: any;
  
  // State
  isDrawingMode: boolean;
  
  // Event handlers
  onMapClick: (coordinates: [number, number]) => void;
  onMapLoad?: (map: any) => void;
}