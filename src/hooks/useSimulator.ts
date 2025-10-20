// src/hooks/useSimulator.ts
import { useState, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';

// Обновленные типы колбэков
type OnTickCallback = (coords: number[], bearing: number) => void;
type OnFinishCallback = () => void;

const log = (step: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  if (details) {
    console.log(`[${timestamp}][useSimulator] ${step}`, details);
  } else {
    console.log(`[${timestamp}][useSimulator] ${step}`);
  }
};

export const useSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const routeRef = useRef<Feature<LineString> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onTickRef = useRef<OnTickCallback>(() => {});
  // Новый ref для колбэка завершения
  const onFinishRef = useRef<OnFinishCallback>(() => {});

  const stopSimulation = useCallback(() => {
    log('stopSimulation called');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsSimulating(false);
    startTimeRef.current = null;
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedTime = (timestamp - startTimeRef.current) / 1000;
      const line = routeRef.current;
      if (!line) return;

      const totalDistance = turf.length(line, { units: 'kilometers' });
      const speedKps = 0.15; // скорость (км/с)
      const distanceCovered = elapsedTime * speedKps;

      if (distanceCovered >= totalDistance) {
        log('Simulation reached end of route');
        const endPoint = line.geometry.coordinates[line.geometry.coordinates.length - 1];
        const prevPoint = line.geometry.coordinates[line.geometry.coordinates.length - 2];
        const finalBearing = turf.bearing(prevPoint, endPoint);

        onTickRef.current(endPoint, finalBearing);
        
        // --- ИЗМЕНЕНИЕ: Вызываем onFinish вместо прямого вызова stopSimulation ---
        onFinishRef.current(); // Сообщаем App.tsx, что мы закончили
        
        // Просто останавливаем анимацию, не меняя глобальное состояние
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        startTimeRef.current = null;
        setIsSimulating(false); // Внутреннее состояние симулятора
        return;
      }

      const newPointFeature = turf.along(line, distanceCovered, { units: 'kilometers' });
      const newCoords = newPointFeature.geometry.coordinates;

      const lookAheadPointFeature = turf.along(line, distanceCovered + 0.001, { units: 'kilometers' });
      const lookAheadCoords = lookAheadPointFeature.geometry.coordinates;
      const currentBearing = turf.bearing(newCoords, lookAheadCoords);

      onTickRef.current(newCoords, currentBearing);

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [] // Убрали stopSimulation из зависимостей
  );

  const startSimulation = useCallback(
    (newRoute: number[][], onTick: OnTickCallback, onFinish: OnFinishCallback) => { // Добавили onFinish
      if (isSimulating || newRoute.length < 2) {
        log('Cannot start simulation', { isSimulating, routeLength: newRoute.length });
        return;
      }

      log('Starting simulation', { routePoints: newRoute.length });
      routeRef.current = turf.lineString(newRoute);
      onTickRef.current = onTick;
      onFinishRef.current = onFinish; // Сохраняем колбэк
      setIsSimulating(true);

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [isSimulating, animate]
  );

  return {
    isSimulating,
    startSimulation,
    stopSimulation,
  };
};