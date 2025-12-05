import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { addMapLayers } from '../utils/mapUtils';
import { ThreeLayer } from '../utils/ThreeLayer';
import { useUIStore } from '../store/uiStore';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_LNG = 76.9286;
const INITIAL_LAT = 43.2567;
const INITIAL_ZOOM = 12;

// Map style URLs by ID
const MAP_STYLES: Record<string, string> = {
  'standard': 'mapbox://styles/mapbox/standard',
  'standard-dark': 'mapbox://styles/mapbox/standard',
  'streets': 'mapbox://styles/mapbox/streets-v12',
  'dark': 'mapbox://styles/mapbox/dark-v11',
  'navigation-night': 'mapbox://styles/mapbox/navigation-night-v1',
  'satellite': 'mapbox://styles/mapbox/satellite-streets-v12',
  'light': 'mapbox://styles/mapbox/light-v11',
};

export const useMapbox = (
  mapContainer: React.RefObject<HTMLDivElement>,
  onMapLoad?: (map: mapboxgl.Map) => void,
  onThreeLayerReady?: (threeLayer: ThreeLayer) => void
) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const threeLayerRef = useRef<ThreeLayer | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const onMapLoadRef = useRef(onMapLoad);
  const onThreeLayerReadyRef = useRef(onThreeLayerReady);
  
  // Get saved map style from store
  const activeStyleId = useUIStore.getState().activeStyleId;

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
    onThreeLayerReadyRef.current = onThreeLayerReady;
  }, [onMapLoad, onThreeLayerReady]);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) {
      console.log('[useMapbox] SKIPPED initialization');
      return;
    }

    // Get saved style or fallback to dark
    const savedStyleUrl = MAP_STYLES[activeStyleId] || MAP_STYLES['dark'];
    console.log('[useMapbox] STARTING initialization with style:', activeStyleId, savedStyleUrl);

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: savedStyleUrl,
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
      pitch: 60,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('[useMapbox] EVENT: "load" fired');
      
      // Apply lightPreset for 3D styles
      if (activeStyleId === 'standard-dark') {
        map.setConfigProperty('basemap', 'lightPreset', 'night');
      } else if (activeStyleId === 'standard') {
        map.setConfigProperty('basemap', 'lightPreset', 'day');
      }

      // ✅ ПРАВИЛЬНЫЙ ПОРЯДОК СЛОЁВ:
      // 1. Добавляем 2D слои (paths, waypoints, territory)
      addMapLayers(map);

      // 2. Добавляем 3D слой (замки, трава)
      console.log('[useMapbox] Adding ThreeLayer for 3D castles');
      const threeLayer = new ThreeLayer('castles-3d');
      threeLayerRef.current = threeLayer;
      map.addLayer(threeLayer as unknown as mapboxgl.CustomLayerInterface);
      console.log('[useMapbox] ThreeLayer added');

      // 3. ✅ КЛЮЧЕВОЕ! Добавляем сферы ПОСЛЕ 3D-слоя с beforeId
      //    Это помещает сферы ПОД 3D-слой в стеке рендеринга
      console.log('[useMapbox] Re-adding spheres layer BEFORE 3D layer');
      if (map.getLayer('spheres-fill')) {
        map.removeLayer('spheres-fill');
      }
      
      // Get current theme for sphere color
      const currentTheme = useUIStore.getState().mapStyleTheme;
      const sphereFillColor = currentTheme === 'light' 
        ? 'rgba(180, 83, 9, 0.25)'  // Dark amber for light maps
        : 'rgba(251, 191, 36, 0.1)'; // Light yellow for dark maps
      
      map.addLayer({
        id: 'spheres-fill',
        type: 'fill',
        source: 'spheres',
        paint: {
          'fill-color': sphereFillColor,
          'fill-opacity': currentTheme === 'light' ? 0.3 : 0.15
        }
      }, 'castles-3d'); // ← beforeId: сферы рендерятся ПЕРЕД 3D-слоем
      console.log('[useMapbox] Spheres layer repositioned under 3D layer');

      // Notify parent that 3D layer is ready
      if (onThreeLayerReadyRef.current) {
        console.log('[useMapbox] Calling onThreeLayerReady callback');
        onThreeLayerReadyRef.current(threeLayer);
      }

      setIsMapLoaded(true);

      // Notify parent that map is ready
      if (onMapLoadRef.current) {
        console.log('[useMapbox] Calling onMapLoad callback');
        onMapLoadRef.current(map);
      }
    });

    map.on('error', (e) => {
      console.error('[Mapbox GL Error]', e.error?.message || e);
    });

    return () => {
      console.log('[useMapbox] CLEANUP');
      map.remove();
      mapRef.current = null;
      threeLayerRef.current = null;
      setIsMapLoaded(false);
    };
  }, [mapContainer]);

  return { map: mapRef, threeLayer: threeLayerRef, isMapLoaded };
};