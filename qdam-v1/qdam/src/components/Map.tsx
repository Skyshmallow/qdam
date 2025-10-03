// src/components/Map.tsx

import { useRef, useEffect, useState, useCallback } from 'react'; 
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_LNG = 76.9286;
const INITIAL_LAT = 43.2567;
const INITIAL_ZOOM = 10;

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(INITIAL_LNG);
  const [lat, setLat] = useState(INITIAL_LAT);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  // Function to re-center the map
  const recenterMap = useCallback(() => {
    if (map.current) {
      map.current.flyTo({
        center: [INITIAL_LNG, INITIAL_LAT],
        zoom: INITIAL_ZOOM,
        speed: 1.5, 
      });
    }
  }, []);

  useEffect(() => {
    if (map.current) return;
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: zoom,
      });

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });

      map.current.addControl(geolocate, 'bottom-right');

      geolocate.on('geolocate', (e) => {
        if ('coords' in e && typeof e.coords === 'object' && e.coords !== null) {
          const userLocation = e.coords as GeolocationCoordinates;
          setLng(userLocation.longitude);
          setLat(userLocation.latitude);
        }
      });

      map.current.on('move', () => {
        if (map.current) {
          setLng(Number(map.current.getCenter().lng.toFixed(4)));
          setLat(Number(map.current.getCenter().lat.toFixed(4)));
          setZoom(Number(map.current.getZoom().toFixed(2)));
        }
      });
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      
      {/* НОВАЯ КНОПКА ЗДЕСЬ */}
      <button onClick={recenterMap} className="recenter-button" title="Recenter Map">
        🎯 {/* You can use an emoji, an SVG icon, or text */}
      </button>

      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default Map;