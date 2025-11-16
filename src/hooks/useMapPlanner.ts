// src/hooks/useMapPlanner.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchRoute } from '../api/mapboxAPI';
import { AbortableRequest } from '@shared/utils/abortableRequest';

const log = (step: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  if (details) {
    console.log(`[${timestamp}][useMapPlanner] ${step}`, details);
  } else {
    console.log(`[${timestamp}][useMapPlanner] ${step}`);
  }
};

export const useMapPlanner = () => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState<number[][]>([]);
  const [simulatableRoute, setSimulatableRoute] = useState<number[][] | null>(null);
  
  // ✅ AbortableRequest для отмены предыдущих запросов
  const routeRequestRef = useRef(new AbortableRequest<number[][] | null>());

  const addWaypoint = useCallback(async (newPoint: number[]) => {
    const updatedWaypoints = [...routeWaypoints, newPoint];
    log('Adding waypoint', { waypoint: newPoint, totalWaypoints: updatedWaypoints.length });
    setRouteWaypoints(updatedWaypoints);
    
    log('Fetching route from API (cancelling previous)');
    // ✅ Автоматически отменяет предыдущий запрос
    const route = await routeRequestRef.current.execute(
      (signal) => fetchRoute(updatedWaypoints, signal)
    );
    
    if (route) {
      log('Route fetched successfully', { routePoints: route.length });
      setSimulatableRoute(route);
    } else {
      log('Failed to fetch route or was cancelled');
    }
  }, [routeWaypoints]);

  const resetPlanner = useCallback(() => {
    log('Resetting planner');
    setIsDrawingMode(false);
    setRouteWaypoints([]);
    setSimulatableRoute(null);
  }, []);

  const updateWaypoints = useCallback((newWaypoints: number[][]) => {
    log('Updating waypoints', { count: newWaypoints.length });
    setRouteWaypoints(newWaypoints);
  }, []);
  
  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      routeRequestRef.current.abort();
    };
  }, []);

  return {
    isDrawingMode,
    setIsDrawingMode,
    routeWaypoints,
    simulatableRoute,
    addWaypoint,
    resetPlanner,
    updateWaypoints,
  };
};