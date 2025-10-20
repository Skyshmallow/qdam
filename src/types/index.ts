import type { Feature, Polygon } from 'geojson';

/**
 * Представляет узел (точку) в игровой сети
 */
export interface Node {
  id: string;
  coordinates: [number, number];
  createdAt: number;
  status: 'pending' | 'established';
  isTemporary?: boolean; // Флаг для тестовых узлов 
}

/**
 * Представляет цепочку между двумя узлами
 */
export interface Chain {
  id: string;
  nodeA_id: string;
  nodeB_id: string;
  path: number[][];
  createdAt: number;
  isTemporary?: boolean; //  Флаг для тестовых цепочек
}

/**
 * Описывает возможные состояния отслеживания
 */
export type TrackingState = 'idle' | 'recording' | 'paused';

/**
 * Props для компонента Map
 */
export interface MapProps {
  avatarPosition: number[] | null;
  bearing: number;
  simulatableRoute: number[][] | null;
  currentPath: number[][];
  routeWaypoints: number[][];
  nodes: Node[];
  territory: Feature<Polygon> | null;
  spheres: any;
  isDrawingMode: boolean;
  onMapClick: (coordinates: [number, number]) => void;
  onMapLoad?: (map: any) => void;
  onThreeLayerReady?: (threeLayer: any) => void;
}

/** @deprecated Use Node instead */
export interface Base {
  id: number;
  coordinates: number[];
  status: 'new' | 'established';
}