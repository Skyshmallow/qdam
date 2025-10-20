// src/hooks/useMapPlanner.ts
import { useState, useCallback } from 'react';
import { fetchRoute } from '../api/mapboxAPI';

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

  const addWaypoint = useCallback(async (newPoint: number[]) => {
    const updatedWaypoints = [...routeWaypoints, newPoint];
    log('Adding waypoint', { waypoint: newPoint, totalWaypoints: updatedWaypoints.length });
    setRouteWaypoints(updatedWaypoints);
    
    log('Fetching route from API');
    const route = await fetchRoute(updatedWaypoints);
    if (route) {
      log('Route fetched successfully', { routePoints: route.length });
      setSimulatableRoute(route);
    } else {
      log('Failed to fetch route');
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