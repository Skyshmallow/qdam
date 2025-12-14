import { useCallback, useEffect } from 'react';
import { useMapStore } from '../store/mapStore';

const ZOOM_STEP = 1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const ZOOM_DURATION = 500; // ms

export function useZoom() {
  const { map } = useMapStore();

  // Zoom In
  const zoomIn = useCallback(() => {
    if (!map) return;

    const currentZoom = map.getZoom();
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);

    map.easeTo({
      zoom: newZoom,
      duration: ZOOM_DURATION,
    });
  }, [map]);

  // Zoom Out
  const zoomOut = useCallback(() => {
    if (!map) return;

    const currentZoom = map.getZoom();
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);

    map.easeTo({
      zoom: newZoom,
      duration: ZOOM_DURATION,
    });
  }, [map]);

  // Set specific zoom level
  const setZoom = useCallback((zoom: number) => {
    if (!map) return;

    const clampedZoom = Math.max(MIN_ZOOM, Math.min(zoom, MAX_ZOOM));

    map.easeTo({
      zoom: clampedZoom,
      duration: ZOOM_DURATION,
    });
  }, [map]);

  // Keyboard shortcuts: + (zoom in), - (zoom out)
  useEffect(() => {
    if (!map) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [map, zoomIn, zoomOut]);

  // Double-click zoom (optional - Mapbox has this by default, but we can customize)
  useEffect(() => {
    if (!map) return;

    const handleDblClick = (e: mapboxgl.MapMouseEvent) => {
      e.preventDefault();

      const currentZoom = map.getZoom();
      const newZoom = Math.min(currentZoom + ZOOM_STEP * 2, MAX_ZOOM);

      map.easeTo({
        zoom: newZoom,
        center: e.lngLat,
        duration: ZOOM_DURATION,
      });
    };

    map.on('dblclick', handleDblClick);
    return () => {
      map.off('dblclick', handleDblClick);
    };
  }, [map]);

  return {
    zoomIn,
    zoomOut,
    setZoom,
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
  };
}
