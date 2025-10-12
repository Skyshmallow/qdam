import { useState, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';

type OnTickCallback = (coords: number[], bearing: number) => void;

export const useSimulator = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const routeRef = useRef<Feature<LineString> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onTickRef = useRef<OnTickCallback>(() => {});

  const stopSimulation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsSimulating(false);
    startTimeRef.current = null;
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    const elapsedTime = (timestamp - startTimeRef.current) / 1000;
    const line = routeRef.current;
    if (!line) return;

    const totalDistance = turf.length(line, { units: 'kilometers' });
    const speedKps = 0.15;
    const distanceCovered = elapsedTime * speedKps;

    if (distanceCovered >= totalDistance) {
      const endPoint = line.geometry.coordinates[line.geometry.coordinates.length - 1];
      const prevPoint = line.geometry.coordinates[line.geometry.coordinates.length - 2];
      const finalBearing = turf.bearing(prevPoint, endPoint);
      onTickRef.current(endPoint, finalBearing);
      stopSimulation();
      return;
    }

    const newPointFeature = turf.along(line, distanceCovered, { units: 'kilometers' });
    const newCoords = newPointFeature.geometry.coordinates;

    const lookAheadPointFeature = turf.along(line, distanceCovered + 0.001, { units: 'kilometers' });
    const lookAheadCoords = lookAheadPointFeature.geometry.coordinates;
    const currentBearing = turf.bearing(newCoords, lookAheadCoords);

    onTickRef.current(newCoords, currentBearing);

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [stopSimulation]);

  const startSimulation = useCallback(
    (newRoute: number[][], onTick: OnTickCallback) => {
      if (isSimulating || newRoute.length < 2) return;

      routeRef.current = turf.lineString(newRoute);
      onTickRef.current = onTick;
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
