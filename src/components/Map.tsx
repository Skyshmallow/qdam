// src/components/Map.tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapbox } from '../hooks/useMapbox';
import { updateGeoJSONSource, addMapLayers } from '../utils/mapUtils';
import { useUIStore } from '../store/uiStore';
import type { MapProps } from '../types';
import { featureCollection, point, lineString } from '@turf/helpers';
import { Avatar3D } from './Avatar3D.ts';
import { ThreeLayer } from '../utils/ThreeLayer';

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
    // ✅ Wrap onThreeLayerReady to also set local state
    useCallback((threeLayer: ThreeLayer) => {
      setIsThreeLayerReady(true);
      onThreeLayerReady?.(threeLayer);
    }, [onThreeLayerReady])
  );
  const avatarMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const avatar3DRef = useRef<Avatar3D | null>(null);
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const [styleVersion, setStyleVersion] = useState(0);
  const [isThreeLayerReady, setIsThreeLayerReady] = useState(false); // ✅ Track ThreeLayer readiness

  // === Mobile optimization ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Disable map rotation on mobile
    if (window.innerWidth <= 768) {
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.enable();
    }

  }, [map, isMapLoaded]);

  // === Helper: Create avatar marker ===
  const createAvatarMarker = useCallback(() => {
    if (!map.current || !avatarPosition) return;

    console.log('[Map.tsx] Creating NEW 3D avatar marker');
    const el = document.createElement('div');
    el.style.width = '100px';
    el.style.height = '100px';

    // Создаём 3D аватар (класс, не React компонент)
    const avatar3D = new Avatar3D(el);
    avatar3D.setBearing(bearing);
    avatar3DRef.current = avatar3D;

    const newMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      pitchAlignment: 'map',
      rotationAlignment: 'map',
    })
      .setLngLat(avatarPosition as [number, number])
      .addTo(map.current);

    avatarMarkerRef.current = newMarker;
  }, [map, avatarPosition, bearing]);

  // === Avatar creation (3D) ===
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    if (avatarPosition) {
      if (!avatarMarkerRef.current) {
        createAvatarMarker();
      } else {
        avatarMarkerRef.current.setLngLat(avatarPosition as [number, number]);
      }
    } else {
      if (avatarMarkerRef.current) {
        avatarMarkerRef.current.remove();
        avatarMarkerRef.current = null;
      }
      if (avatar3DRef.current) {
        avatar3DRef.current.dispose();
        avatar3DRef.current = null;
      }
    }
  }, [avatarPosition, isMapLoaded, map, bearing, createAvatarMarker]);

  // === Recreate layers and avatar on style change (skip initial load) ===
  useEffect(() => {
    if (!map.current) return;

    const handleStyleLoad = () => {
      // Skip the first style.load event (initial map load)
      if (isInitialLoadRef.current) {
        console.log('[Map.tsx] Style loaded (initial), skipping layer recreation');
        isInitialLoadRef.current = false;
        return;
      }

      console.log('[Map.tsx] Style changed, recreating layers and avatar');

      // Re-add all map layers (sources were removed by setStyle)
      addMapLayers(map.current!);
      console.log('[Map.tsx] Map layers re-added after style change');

      // Re-add ThreeLayer for 3D effects (castles, grass)
      console.log('[Map.tsx] Re-adding ThreeLayer after style change');
      const newThreeLayer = new ThreeLayer('castles-3d');

      // Update the ref so App.tsx can use it
      if (threeLayerRef) {
        threeLayerRef.current = newThreeLayer;
      }

      map.current!.addLayer(newThreeLayer as unknown as mapboxgl.CustomLayerInterface);

      // ✅ Set theme for 3D sphere effects
      const currentTheme = useUIStore.getState().mapStyleTheme;
      newThreeLayer.setTheme(currentTheme);

      // Re-position spheres layer under ThreeLayer
      if (map.current!.getLayer('spheres-fill')) {
        map.current!.removeLayer('spheres-fill');
        
        // Get current theme for sphere color
        const sphereFillColor = currentTheme === 'light' 
          ? 'rgba(180, 83, 9, 0.25)'  // Dark amber for light maps
          : 'rgba(251, 191, 36, 0.1)'; // Light yellow for dark maps
        
        map.current!.addLayer({
          id: 'spheres-fill',
          type: 'fill',
          source: 'spheres',
          paint: {
            'fill-color': sphereFillColor,
            'fill-opacity': currentTheme === 'light' ? 0.3 : 0.15
          }
        }, 'castles-3d');
      }

      console.log('[Map.tsx] ThreeLayer re-added');

      // Notify parent that ThreeLayer is ready
      if (onThreeLayerReady) {
        onThreeLayerReady(newThreeLayer);
      }

      // Trigger re-sync of multiplayer layers
      setStyleVersion(v => v + 1);

      // Remove old avatar marker if exists
      if (avatarMarkerRef.current) {
        avatarMarkerRef.current.remove();
        avatarMarkerRef.current = null;
      }
      if (avatar3DRef.current) {
        avatar3DRef.current.dispose();
        avatar3DRef.current = null;
      }

      // Recreate avatar if we have position
      if (avatarPosition) {
        createAvatarMarker();
      }
    };

    const mapInstance = map.current;
    mapInstance.on('style.load', handleStyleLoad);

    return () => {
      mapInstance?.off('style.load', handleStyleLoad);
    };
  }, [map, avatarPosition, bearing, createAvatarMarker, onThreeLayerReady, threeLayerRef]);

  // === Update avatar bearing ===
  useEffect(() => {
    if (avatar3DRef.current) {
      avatar3DRef.current.setBearing(bearing);
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

    const mapInstance = map.current;
    mapInstance.on('click', handleMapClick);
    return () => {
      mapInstance?.off('click', handleMapClick);
    };
  }, [map, isDrawingMode, onMapClick]);


  // === Sync map data ===
  useEffect(() => {
    // 🔍 DEBUG: Log at the START of useEffect to see if it runs
    console.log('[Map.tsx] useEffect TRIGGERED', {
      hasMap: !!map.current,
      isMapLoaded,
      isStyleLoaded: map.current?.isStyleLoaded?.() ?? 'no map',
      simulatableRoutePoints: simulatableRoute?.length || 0,
      routeWaypointsCount: routeWaypoints?.length || 0,
    });

    if (!map.current || !isMapLoaded) {
      console.log('[Map.tsx] Early return: no map or not loaded');
      return;
    }
    
    // ✅ FIX: Don't check isStyleLoaded() - it returns false during repaint
    // The sources are already created when isMapLoaded is true
    // Instead, check if the source exists before updating
    if (!map.current.getSource('route')) {
      console.log('[Map.tsx] Early return: sources not ready yet');
      return;
    }

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

    // 🔍 DEBUG: Log what we're updating
    console.log('[Map.tsx] Syncing map data', {
      hasRoute: simulatableRoute && simulatableRoute.length > 1,
      routePoints: simulatableRoute?.length || 0,
      waypointsCount: routeWaypoints?.length || 0,
      hasTerritory: !!territory,
      territoryCoords: territory?.geometry?.coordinates?.[0]?.length || 0,
      hasRouteSource: !!map.current.getSource('route'),
      hasWaypointsSource: !!map.current.getSource('waypoints'),
      hasTerritorySource: !!map.current.getSource('territory'),
    });

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
    // Only update when ThreeLayer is ready (fixes race condition)
    if (threeLayerRef?.current && isThreeLayerReady) {
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
    threeLayerRef,
    styleVersion,
    isThreeLayerReady // ✅ Re-run when ThreeLayer becomes ready
  ]);

  return <div ref={mapContainer} className="map-container w-full h-full" />;
};

export default Map;