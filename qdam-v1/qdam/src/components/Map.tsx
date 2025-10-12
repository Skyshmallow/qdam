// src/components/Map.tsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapbox } from '../hooks/useMapbox';
import { updateGeoJSONSource } from '../utils/mapUtils';
import type { MapProps } from '../types';

export const Map = ({
  avatarPosition,
  bearing,
  simulatableRoute,
  currentPath,
  routeWaypoints,
  bases,
  isDrawingMode,
  onMapClick,
  onMapLoad,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const { map, isMapLoaded } = useMapbox(mapContainer, onMapLoad);
  const avatarMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // === Создание и обновление аватара ===
  useEffect(() => {
    console.log(
      '%c[Map.tsx]',
      'color: #E91E63; font-weight: bold;',
      'Avatar useEffect triggered. Dependencies:',
      {
        avatarPosition,
        isMapLoaded,
        isMapInstanceReady: !!map.current
      }
    );
    if (!map.current || !isMapLoaded) {
      // --- LOG ---
      console.warn('%c[Map.tsx]', 'color: #E91E63;', 'Skipping avatar render: map is not ready.');
      return;
    };

    if (avatarPosition) {
      console.log('%c[Map.tsx]', 'color: #E91E63;', 'avatarPosition is valid. Creating or updating marker at:', avatarPosition);
      if (!avatarMarkerRef.current) {
        console.log('%c[Map.tsx]', 'color: #E91E63;', 'Creating NEW avatar marker.');
        const el = document.createElement('div');
        el.className = 'pulsing-avatar'; // Стили управляют видом и анимацией

        const newMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(avatarPosition as [number, number])
          .addTo(map.current);

        avatarMarkerRef.current = newMarker;
      } else {
        console.log('%c[Map.tsx]', 'color: #E91E63;', 'Updating EXISTING avatar marker.');
        avatarMarkerRef.current.setLngLat(avatarPosition as [number, number]);
      }
    } else {
      console.log('%c[Map.tsx]', 'color: #E91E63;', 'avatarPosition is null. Removing marker if it exists.');
      if (avatarMarkerRef.current) {
        avatarMarkerRef.current.remove();
        avatarMarkerRef.current = null;
      }
    }
  }, [avatarPosition, isMapLoaded, map]);

  // === Поворот аватара ===
  useEffect(() => {
    if (avatarMarkerRef.current) {
      const el = avatarMarkerRef.current.getElement();
      // Только CSS-поворот — без манипуляций DOM
      el.style.setProperty('--bearing', `${360 - bearing}deg`);
    }
  }, [bearing]);

  // === Обработка кликов по карте ===
  useEffect(() => {
    if (!map.current || !isDrawingMode) return;

    const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
      onMapClick?.([e.lngLat.lng, e.lngLat.lat]);
    };

    map.current.on('click', handleMapClick);
    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [map, isDrawingMode, onMapClick]);

  // === Синхронизация данных на карте ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const emptyLineFeature = {
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [] },
      properties: {},
    };

    const routeGeoJSON =
      simulatableRoute && simulatableRoute.length > 1
        ? {
            type: 'Feature' as const,
            geometry: { type: 'LineString', coordinates: simulatableRoute },
            properties: {},
          }
        : emptyLineFeature;

    const recordedPathGeoJSON =
      currentPath && currentPath.length > 1
        ? {
            type: 'Feature' as const,
            geometry: { type: 'LineString', coordinates: currentPath },
            properties: {},
          }
        : emptyLineFeature;

    updateGeoJSONSource(map.current, 'recordedPath', recordedPathGeoJSON);
    updateGeoJSONSource(map.current, 'route', routeGeoJSON);

    // Waypoints
    if (routeWaypoints?.length) {
      const points = routeWaypoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point', coordinates: p },
        properties: {},
      }));
      updateGeoJSONSource(map.current, 'waypoints', {
        type: 'FeatureCollection',
        features: points,
      });
    }

    // Bases
    if (bases?.length) {
      const basePoints = bases.map((b) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point', coordinates: b.coordinates },
        properties: {},
      }));
      updateGeoJSONSource(map.current, 'bases', {
        type: 'FeatureCollection',
        features: basePoints,
      });
    }
  }, [isMapLoaded, map, simulatableRoute, currentPath, routeWaypoints, bases]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
