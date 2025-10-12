// src/hooks/useMapbox.ts
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { addMapLayers } from '../utils/mapUtils';

// Ensure the token is set before using the library
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_LNG = 76.9286;
const INITIAL_LAT = 43.2567;
const INITIAL_ZOOM = 12;

export const useMapbox = (
  mapContainer: React.RefObject<HTMLDivElement>,
  onMapLoad?: (map: mapboxgl.Map) => void
) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const onMapLoadRef = useRef(onMapLoad);

  useEffect(() => {
    onMapLoadRef.current = onMapLoad;
  }, [onMapLoad]);

  useEffect(() => {
    // This check prevents re-initialization on fast re-renders or StrictMode double-invokes
    if (mapRef.current || !mapContainer.current) {
        console.log('[useMapbox] SKIPPED initialization: Map already exists or container is not ready.');
        return;
    }
    console.log('[useMapbox] STARTING initialization...');
    
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM,
    });
    mapRef.current = map; // Store instance immediately

    map.on('load', () => {
      console.log('[useMapbox] EVENT: "load" fired. Map is fully ready.');
      addMapLayers(map);
      setIsMapLoaded(true);
      if (onMapLoadRef.current) {
        console.log('[useMapbox] Calling onMapLoad callback provided by App.');
        onMapLoadRef.current(map);
      }
    });

    map.on('error', (e) => {
        console.error('[Mapbox GL Error]', e.error?.message || e);
    });

    // Cleanup function
    return () => {
      console.log('[useMapbox] CLEANUP: Removing map instance.');
      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false); // Reset loaded state
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array is empty, this should only run once on mount

  return { map: mapRef, isMapLoaded };
};