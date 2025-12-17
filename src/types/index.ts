import type { Feature, Polygon, FeatureCollection } from 'geojson';
import type { ThreeLayer } from '../utils/ThreeLayer';

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
 * Player territory for multiplayer display
 */
export interface PlayerTerritory {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  territoryKm2: number;
  territory: Feature<Polygon> | null;
  color: string;
  nodes: Array<[number, number]>;
  chains: Array<{
    id: string;
    path: number[][];
  }>;
}

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
  spheres: FeatureCollection;
  isDrawingMode: boolean;
  onMapClick: (coordinates: [number, number]) => void;
  onMapLoad?: (map: mapboxgl.Map) => void;
  onThreeLayerReady?: (threeLayer: ThreeLayer) => void;
  threeLayerRef?: React.RefObject<ThreeLayer | null>;
  // Multiplayer
  otherTerritories?: PlayerTerritory[];
  territoryConflicts?: string[];
}

/** @deprecated Use Node instead */
export interface Base {
  id: number;
  coordinates: number[];
  status: 'new' | 'established';
}

export type ActivityState =
  | 'idle'
  | 'tracking'
  | 'tracking_paused'
  | 'planning_start'
  | 'planning_end'
  | 'ready_to_simulate'
  | 'simulating';