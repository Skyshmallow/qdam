// src/hooks/usePositionWatcher.ts
import { useEffect, useRef } from 'react';
import { useThrottle } from './useThrottle'; 

const MAX_WALKING_SPEED_MPS = 5;

const log = (step: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  if (details) {
    console.log(`[${timestamp}][usePositionWatcher] ${step}`, details);
  } else {
    console.log(`[${timestamp}][usePositionWatcher] ${step}`);
  }
};

/**
 * Хук для непрерывного отслеживания геолокации (watchPosition).
 * @param isActive - Флаг, включающий/выключающий отслеживание.
 * @param onPositionUpdate - Callback, который будет вызываться с новыми координатами.
 */
export const usePositionWatcher = (
  isActive: boolean,
  onPositionUpdate: (coords: [number, number]) => void,
  onCheatDetected: () => void 
) => {
  const watchIdRef = useRef<number | null>(null);
  const positionCountRef = useRef<number>(0);

  const throttledOnPositionUpdate = useThrottle(onPositionUpdate, 1000);

  useEffect(() => {
    if (!isActive) {
      if (watchIdRef.current !== null) {
        log('Stopping position watch', { totalPositions: positionCountRef.current });
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        positionCountRef.current = 0;
      }
      return;
    }

    if (watchIdRef.current === null) {
      log('Starting position watch');
      const watchId = navigator.geolocation.watchPosition(
        (position) => {

          if (position.coords.speed && position.coords.speed > MAX_WALKING_SPEED_MPS) {
              log('Cheat detected: speed limit exceeded', { speed: position.coords.speed });
              onCheatDetected();
              return; // Прерываем обработку этой точки
          }

          positionCountRef.current++;
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          // Log only every 5th position to avoid spam
          if (positionCountRef.current === 1 || positionCountRef.current % 5 === 0) {
            log('Position update', { 
              count: positionCountRef.current,
              coords,
              accuracy: position.coords.accuracy 
            });
          }
          throttledOnPositionUpdate(coords);
        },
        (error) => {
          log('Error watching position', { 
            code: error.code, 
            message: error.message 
          });
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 5000, // Использовать кэш до 5 секунд для снижения нагрузки на API
          timeout: 15000 // Таймаут 15 секунд
        }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null) {
        log('Cleanup: Stopping position watch', { totalPositions: positionCountRef.current });
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        positionCountRef.current = 0;
      }
    };
  }, [isActive, throttledOnPositionUpdate, onCheatDetected]);
};