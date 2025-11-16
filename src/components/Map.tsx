// src/components/Map.tsx
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapbox } from '../hooks/useMapbox';
import { updateGeoJSONSource } from '../utils/mapUtils';
import type { MapProps } from '../types';
import { featureCollection, point, lineString } from '@turf/helpers';

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
  threeLayerRef,
  otherTerritories = [],
  territoryConflicts = [],
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null!);
  const { map, isMapLoaded } = useMapbox(
    mapContainer, 
    onMapLoad,
    onThreeLayerReady
  );
  const avatarMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // === Mobile optimization ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Disable map rotation on mobile
    if (window.innerWidth <= 768) {
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.enable();
    }

  }, [map, isMapLoaded]);

  // === Avatar creation ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    if (avatarPosition) {
      if (!avatarMarkerRef.current) {
        console.log('[Map.tsx] Creating NEW avatar marker');
        const el = document.createElement('div');
        el.className = 'pulsing-avatar';
        
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';

        const newMarker = new mapboxgl.Marker({ 
          element: el, 
          anchor: 'center',
          pitchAlignment: 'viewport',
          rotationAlignment: 'viewport',
        })
          .setLngLat(avatarPosition as [number, number])
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
        ? lineString(simulatableRoute)
        : emptyLineFeature;

    const recordedPathGeoJSON =
      currentPath && currentPath.length > 1
        ? lineString(currentPath)
        : emptyLineFeature;

    updateGeoJSONSource(map.current, 'recordedPath', recordedPathGeoJSON);
    updateGeoJSONSource(map.current, 'route', routeGeoJSON);

    const waypointsGeoJSON = routeWaypoints?.length
      ? featureCollection(routeWaypoints.map(p => point(p)))
      : featureCollection([]);

    updateGeoJSONSource(map.current, 'waypoints', waypointsGeoJSON);

    // ✅ Territory (my territory)
    const territoryGeoJSON = territory || featureCollection([]);
    updateGeoJSONSource(map.current, 'territory', territoryGeoJSON);

    // ✅ 3D Grass/Territory Effect (own territory)
    if (threeLayerRef?.current) {
      threeLayerRef.current.updateTerritory(territory);
      
      // Update other players' territories with colored grass
      threeLayerRef.current.updateOtherTerritories(
        otherTerritories.map(player => ({
          userId: player.userId,
          territory: player.territory,
          color: player.color,
        }))
      );
    }

    // ✅ Other players' territories (multiplayer)
    // Note: Only show territory polygons, NOT individual nodes/chains (privacy)
    otherTerritories.forEach((player) => {
      const sourceName = `territory-${player.userId}`;
      const layerName = `territory-layer-${player.userId}`;

      // Check if source exists
      if (!map.current!.getSource(sourceName)) {
        // Add source
        map.current!.addSource(sourceName, {
          type: 'geojson',
          data: player.territory || featureCollection([]),
        });

        // Add territory fill layer
        map.current!.addLayer({
          id: layerName,
          type: 'fill',
          source: sourceName,
          paint: {
            'fill-color': player.color,
            'fill-opacity': territoryConflicts.includes(player.userId) ? 0.4 : 0.2,
          },
        });

        // Add territory outline layer
        map.current!.addLayer({
          id: `${layerName}-outline`,
          type: 'line',
          source: sourceName,
          paint: {
            'line-color': player.color,
            'line-width': territoryConflicts.includes(player.userId) ? 3 : 2,
            'line-dasharray': territoryConflicts.includes(player.userId) ? [2, 2] : [1, 0],
          },
        });

      } else {
        // Update existing sources
        updateGeoJSONSource(
          map.current!,
          sourceName,
          player.territory || featureCollection([])
        );

        // Update conflict styling
        if (map.current!.getLayer(layerName)) {
          map.current!.setPaintProperty(
            layerName,
            'fill-opacity',
            territoryConflicts.includes(player.userId) ? 0.4 : 0.2
          );
          map.current!.setPaintProperty(
            `${layerName}-outline`,
            'line-width',
            territoryConflicts.includes(player.userId) ? 3 : 2
          );
          map.current!.setPaintProperty(
            `${layerName}-outline`,
            'line-dasharray',
            territoryConflicts.includes(player.userId) ? [2, 2] : [1, 0]
          );
        }
      }
    });

    // ✅ Spheres
    updateGeoJSONSource(map.current, 'spheres', spheres);

    // ✅ Use ThreeLayer ref instead of getLayer
    const threeLayer = threeLayerRef?.current;
    
    if (threeLayer) {
      if (threeLayer.updateSpheres) {
        threeLayer.updateSpheres(spheres);
      }
    }

  }, [
    isMapLoaded,
    map,
    simulatableRoute,
    currentPath,
    routeWaypoints,
    territory,
    spheres,
    otherTerritories,
    territoryConflicts,
  ]);

  return <div ref={mapContainer} className="map-container w-full h-full" />;
};

export default Map;