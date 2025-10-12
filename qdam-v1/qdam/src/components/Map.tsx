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
  spheres,
  isDrawingMode,
  onMapClick,
  onMapLoad,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const { map, isMapLoaded } = useMapbox(mapContainer, onMapLoad);
  const avatarMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const baseMarkersRef = useRef<Record<number, { castle: mapboxgl.Marker }>>({});
  
  // === Создание и обновление аватара ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    if (avatarPosition) {
      if (!avatarMarkerRef.current) {
        console.log('%c[Map.tsx]', 'color: #E91E63;', 'Creating NEW avatar marker.');
        const el = document.createElement('div');
        el.className = 'pulsing-avatar';

        const newMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(avatarPosition as [number, number])
          .setPitchAlignment('map')
          .addTo(map.current);

        avatarMarkerRef.current = newMarker;
      } else {
        avatarMarkerRef.current.setLngLat(avatarPosition as [number, number]);
      }
    } else {
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
      el.style.setProperty('--bearing', `${bearing}deg`);
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

    // // Bases
    // if (bases?.length) {
    //   const basePoints = bases.map((b) => ({
    //     type: 'Feature' as const,
    //     geometry: { type: 'Point', coordinates: b.coordinates },
    //     properties: {},
    //   }));
    //   updateGeoJSONSource(map.current, 'bases', {
    //     type: 'FeatureCollection',
    //     features: basePoints,
    //   });
    // }
    updateGeoJSONSource(map.current, 'spheres', spheres);

  }, [isMapLoaded, map, simulatableRoute, currentPath, routeWaypoints, bases, spheres]);

  // === Создание, обновление и удаление Баз и Сфер ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const currentMarkers = baseMarkersRef.current;
    const baseIdsOnMap = Object.keys(currentMarkers).map(Number);
    const baseIdsFromState = bases.map(b => b.id);

    // 1. Создание новых маркеров
    bases.forEach(base => {
      if (!currentMarkers[base.id]) {
        console.log(`%c[Map.tsx] Creating markers for new base #${base.id}`, 'color: #03A9F4;');
        // --- Маркер Замка ---
        const castleEl = document.createElement('div');
        castleEl.className = 'castle-marker';
        // Добавляем класс для анимации появления, если база новая
        if (base.status === 'new') {
          castleEl.classList.add('appearing');
        }
        const castleMarker = new mapboxgl.Marker({ element: castleEl, anchor: 'bottom' })
          .setLngLat(base.coordinates as [number, number])
          .addTo(map.current!);

        // Сохраняем ссылки на созданные маркеры
        currentMarkers[base.id] = { castle: castleMarker };
      }
    });

    // 2. Удаление старых маркеров (важно для Шага 5, когда базы будут "потребляться")
    baseIdsOnMap.forEach(markerId => {
      if (!baseIdsFromState.includes(markerId)) {
        console.log(`%c[Map.tsx] Removing markers for base #${markerId}`, 'color: #F44336;');
        currentMarkers[markerId].castle.remove();
        delete currentMarkers[markerId];
      }
    });
  }, [bases, isMapLoaded, map]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;