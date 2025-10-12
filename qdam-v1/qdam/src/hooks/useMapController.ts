// src/hooks/useMapController.ts
import { useEffect } from 'react';
import { useMapStore } from '../store/mapStore';

export const useMapController = () => {
  const {
    map,
    avatarPosition,
    bearing,
    isInitialFlightDone,
    completeInitialFlight,
    resetCamera,
  } = useMapStore();

  useEffect(() => {
    if (!map || !avatarPosition) return;

    // Если "прилет" еще не был совершен, делаем flyTo
    if (!isInitialFlightDone) {
      console.log('[useMapController] Выполняю первый полёт к аватару...');
      map.flyTo({
        center: avatarPosition as [number, number],
        zoom: 17,
        pitch: 60,
        bearing: 360 - bearing,
      });

      map.once('moveend', () => {
        completeInitialFlight();
      });
    } else {
      map.easeTo({
        center: avatarPosition as [number, number],
        bearing: 360 - bearing,
        duration: 500,
      });
    }
  }, [map, avatarPosition, bearing, isInitialFlightDone, completeInitialFlight]);

  return {
    resetCamera,
  };
};