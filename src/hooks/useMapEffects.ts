// src/hooks/useMapEffects.ts
import { useCallback, useEffect } from 'react';
import type { ThreeLayer } from '../utils/ThreeLayer';

interface UseMapEffectsProps {
  map: any;
  setMap: (map: any) => void;
  threeLayerRef: React.MutableRefObject<ThreeLayer | null>;
  isThreeLayerReady: boolean;
  setIsThreeLayerReady: (ready: boolean) => void;
  chains: any[];
  nodes: any[];
  spheres: any;
  activityState: string;
  nodesHook: any;
  chainsHook: any;
  log: (step: string, details?: Record<string, unknown>) => void;
}

/**
 * Hook для управления событиями карты и 3D слоем
 * Извлечен из App.tsx для уменьшения размера компонента
 */
export const useMapEffects = ({
  map,
  setMap,
  threeLayerRef,
  isThreeLayerReady,
  setIsThreeLayerReady,
  chains,
  nodes,
  spheres,
  activityState,
  nodesHook,
  chainsHook,
  log,
}: UseMapEffectsProps) => {
  
  // === MAP LOAD HANDLER ===
  const handleMapLoad = useCallback((loadedMap: any) => {
    setMap(loadedMap);
    log('Map loaded');
    loadedMap.setPitch(60);
  }, [setMap, log]);

  // === THREELAYER READY HANDLER ===
  const handleThreeLayerReady = useCallback((threeLayer: ThreeLayer) => {
    log('ThreeLayer ready, storing reference');
    threeLayerRef.current = threeLayer;
    setIsThreeLayerReady(true);
  }, [threeLayerRef, setIsThreeLayerReady, log]);

  // === UPDATE 3D CASTLES WHEN CHAINS CHANGE ===
  useEffect(() => {
    if (!threeLayerRef.current || !isThreeLayerReady || nodesHook.isLoading || chainsHook.isLoading) {
      log('Waiting for ThreeLayer or initial data load', {
        hasThreeLayer: !!threeLayerRef.current,
        isReady: isThreeLayerReady,
        isNodesLoading: nodesHook.isLoading,
        isChainsLoading: chainsHook.isLoading
      });
      return;
    }
    
    if (chains.length === 0) {
      log('No chains to display');
      threeLayerRef.current.setChains([]);
      return;
    }
    
    const chainsData = chains.map(chain => {
      const nodeA = nodes.find((n: any) => n.id === chain.nodeA_id);
      const nodeB = nodes.find((n: any) => n.id === chain.nodeB_id);
      
      if (!nodeA || !nodeB) {
        console.warn('[App] Chain has missing nodes', { chainId: chain.id });
        return null;
      }
      
      return {
        id: parseInt(chain.id.slice(0, 8), 36),
        start: nodeA.coordinates,
        end: nodeB.coordinates,
        startCoords: nodeA.coordinates,
        endCoords: nodeB.coordinates
      };
    }).filter(Boolean);
    
    log('Updating 3D layer with chains', { count: chainsData.length });
    threeLayerRef.current.setChains(chainsData as any);
  }, [chains, nodes, isThreeLayerReady, threeLayerRef, nodesHook.isLoading, chainsHook.isLoading, log]);

  // === SYNC 3D SPHERES WHEN SPHERES CHANGE ===
  useEffect(() => {
    if (!threeLayerRef.current || !isThreeLayerReady || !spheres) return;

    log('Updating 3D spheres', { featureCount: spheres.features.length });
    threeLayerRef.current.updateSpheres(spheres);

  }, [spheres, isThreeLayerReady, threeLayerRef, log]);

  // === CURSOR STYLE ===
  useEffect(() => {
    if (!map) return;
    const isPickingMode = activityState === 'planning_start' || activityState === 'planning_end';
    map.getCanvas().style.cursor = isPickingMode ? 'crosshair' : '';
  }, [activityState, map]);

  return {
    handleMapLoad,
    handleThreeLayerReady,
  };
};
