// src/hooks/usePositionWatcher.ts
import { useEffect, useRef } from 'react';
import { useThrottle } from './useThrottle'; 

/**
 * Хук для непрерывного отслеживания геолокации (watchPosition).
 * @param isActive - Флаг, включающий/выключающий отслеживание.
 * @param onPositionUpdate - Callback, который будет вызываться с новыми координатами.
 */
export const usePositionWatcher = (
  isActive: boolean,
  onPositionUpdate: (coords: [number, number]) => void
) => {
  const watchIdRef = useRef<number | null>(null);

  const throttledOnPositionUpdate = useThrottle(onPositionUpdate, 1000);

  useEffect(() => {
    if (!isActive) {
      if (watchIdRef.current !== null) {
        console.log('[usePositionWatcher] > Stopping position watch.');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (watchIdRef.current === null) {
      console.log('[usePositionWatcher] > Starting position watch.');
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          throttledOnPositionUpdate(coords);
        },
        (error) => {
          console.error('[usePositionWatcher] > Error watching position:', error);
        },
        { enableHighAccuracy: true }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null) {
        console.log('[usePositionWatcher] > Cleanup: Stopping position watch.');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, throttledOnPositionUpdate]);
};