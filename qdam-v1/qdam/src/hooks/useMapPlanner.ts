// src/hooks/useMapPlanner.ts
import { useState, useCallback } from 'react';
import { fetchRoute } from '../api/mapboxAPI';

export const useMapPlanner = () => {
  // Режим рисования: true, если пользователь сейчас кликает по карте для создания маршрута
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  // Опорные точки: массив координат, по которым кликнул пользователь
  const [routeWaypoints, setRouteWaypoints] = useState<number[][]>([]);
  // Готовый маршрут: детальный путь, полученный от Mapbox API, готовый для симуляции
  const [simulatableRoute, setSimulatableRoute] = useState<number[][] | null>(null);

  /**
   * Добавляет новую опорную точку и запрашивает обновленный маршрут
   */
  const addWaypoint = useCallback(async (newPoint: number[]) => {
    const updatedWaypoints = [...routeWaypoints, newPoint];
    setRouteWaypoints(updatedWaypoints);
    
    // Запрашиваем новый маршрут у API
    const route = await fetchRoute(updatedWaypoints);
    if (route) {
      setSimulatableRoute(route);
    }
  }, [routeWaypoints]);

  /**
   * Полностью сбрасывает состояние планировщика
   */
  const resetPlanner = useCallback(() => {
    setIsDrawingMode(false);
    setRouteWaypoints([]);
    setSimulatableRoute(null);
  }, []);

  return {
    isDrawingMode,
    setIsDrawingMode,
    routeWaypoints,
    simulatableRoute,
    addWaypoint,
    resetPlanner,
  };
};