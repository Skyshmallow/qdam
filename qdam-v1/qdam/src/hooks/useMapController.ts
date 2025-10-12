// src/hooks/useMapController.ts
import { useMapStore } from '../store/mapStore';
import { useCallback } from 'react';

export const useMapController = () => {
  // Получаем доступ ко всему стору, включая метод getState
  const { map, completeInitialFlight, isInitialFlightDone } = useMapStore();
  const getState = useMapStore.getState;

  /**
   * Выполняет "прилёт" камеры к текущей позиции аватара.
   * Читает avatarPosition и bearing напрямую из стора в момент вызова.
   */
  const flyToAvatar = useCallback(() => {
    // Получаем самые свежие данные прямо из стора
    const { avatarPosition, bearing } = getState();
    
    if (!map || !avatarPosition) return;
    
    console.log('[useMapController] Выполняю принудительный полёт к аватару...');
    
    const currentIsInitialFlightDone = isInitialFlightDone;

    if (!currentIsInitialFlightDone) {
      map.flyTo({
        center: avatarPosition as [number, number],
        zoom: 17,
        pitch: 60,
        bearing: (bearing + 360) % 360,
      });

      map.once('moveend', () => {
        completeInitialFlight();
      });
    } else {
      map.easeTo({
        center: avatarPosition as [number, number],
        zoom: 17,
        duration: 1000,
      });
    }
  }, [map, isInitialFlightDone, completeInitialFlight, getState]); 

  return {
    flyToAvatar,
  };
};