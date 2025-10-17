import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { addMapLayers } from '../utils/mapUtils';
import { ThreeLayer } from '../utils/ThreeLayer';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_LNG = 76.9286;
const INITIAL_LAT = 43.2567;
const INITIAL_ZOOM = 12;

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

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
    onThreeLayerReadyRef.current = onThreeLayerReady;
  }, [onMapLoad, onThreeLayerReady]);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) {
      console.log('[useMapbox] SKIPPED initialization');
      return;
    }

    console.log('[useMapbox] STARTING initialization...');

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
      pitch: 60,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      console.log('[useMapbox] EVENT: "load" fired');

      // Add 2D layers (spheres, territory, paths)
      addMapLayers(map);
      
      // Initialize 3D castles layer
      console.log('[useMapbox] Adding ThreeLayer for 3D castles');
      const threeLayer = new ThreeLayer('castles-3d');
      threeLayerRef.current = threeLayer;
      map.addLayer(threeLayer as any);
      console.log('[useMapbox] ThreeLayer added');
      
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
  }, []);

  return { map: mapRef, threeLayer: threeLayerRef, isMapLoaded };
};