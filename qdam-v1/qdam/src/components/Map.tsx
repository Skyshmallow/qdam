import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapbox } from '../hooks/useMapbox';
import { updateGeoJSONSource } from '../utils/mapUtils';
import type { MapProps } from '../types';
import * as turf from '@turf/turf';

export const Map = ({
  avatarPosition,
  bearing,
  simulatableRoute,
  currentPath,
  routeWaypoints,
  territory,
  spheres,
  isDrawingMode,
  onMapClick,
  onMapLoad,
  onThreeLayerReady,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const { map, isMapLoaded } = useMapbox(
    mapContainer, 
    onMapLoad,
    onThreeLayerReady
  );
  const avatarMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // === Avatar creation ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    if (avatarPosition) {
      if (!avatarMarkerRef.current) {
        console.log('[Map.tsx] Creating NEW avatar marker');
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

  // === Avatar rotation ===
  useEffect(() => {
    if (avatarMarkerRef.current) {
      const el = avatarMarkerRef.current.getElement();
      el.style.setProperty('--bearing', `${bearing}deg`);
    }
  }, [bearing]);

  // === Map clicks ===
  useEffect(() => {
    if (!map.current || !isDrawingMode) return;

    const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
      console.log('[Map.tsx] Map clicked', { 
        lng: e.lngLat.lng, 
        lat: e.lngLat.lat,
        isDrawingMode 
      });
      onMapClick?.([e.lngLat.lng, e.lngLat.lat]);
    };

    map.current.on('click', handleMapClick);
    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [map, isDrawingMode, onMapClick]);


  // === Sync map data ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const emptyLineFeature = {
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [] },
      properties: {},
    };

    const routeGeoJSON =
      simulatableRoute && simulatableRoute.length > 1
        ? turf.lineString(simulatableRoute)
        : emptyLineFeature;

    const recordedPathGeoJSON =
      currentPath && currentPath.length > 1
        ? turf.lineString(currentPath)
        : emptyLineFeature;

    updateGeoJSONSource(map.current, 'recordedPath', recordedPathGeoJSON);
    updateGeoJSONSource(map.current, 'route', routeGeoJSON);

    const waypointsGeoJSON = routeWaypoints?.length
      ? turf.featureCollection(routeWaypoints.map(p => turf.point(p)))
      : turf.featureCollection([]);

    updateGeoJSONSource(map.current, 'waypoints', waypointsGeoJSON);

    // ✅ Territory
    const territoryGeoJSON = territory || turf.featureCollection([]);
    updateGeoJSONSource(map.current, 'territory', territoryGeoJSON);

    // ✅ Spheres
    updateGeoJSONSource(map.current, 'spheres', spheres);

  }, [isMapLoaded, map, simulatableRoute, currentPath, routeWaypoints, territory, spheres]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;