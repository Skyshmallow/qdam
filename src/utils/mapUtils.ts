import { featureCollection, point } from '@turf/helpers';
import { useUIStore } from '../store/uiStore';

// Sphere color based on theme
export const getSphereColors = (theme: 'light' | 'dark') => ({
  fillColor: theme === 'light' ? 'rgba(180, 83, 9, 0.25)' : 'rgba(251, 191, 36, 0.1)',
  fillOpacity: theme === 'light' ? 0.3 : 0.15,
});

export const addMapLayers = (map: mapboxgl.Map) => {
  // Get current theme
  const currentTheme = useUIStore.getState().mapStyleTheme;
  const sphereColors = getSphereColors(currentTheme);
  
  const emptyLine = {
    type: 'Feature' as const,
    geometry: { type: 'LineString' as const, coordinates: [] },
    properties: {}
  };

  // --- Route ---
  map.addSource('route', { type: 'geojson', data: emptyLine });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#888', 'line-width': 5, 'line-opacity': 0.8 }
  });

  // --- Recorded Path ---
  map.addSource('recordedPath', { type: 'geojson', data: emptyLine });
  map.addLayer({
    id: 'recordedPath',
    type: 'line',
    source: 'recordedPath',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#e53e3e', 'line-width': 7 }
  }, 'route');

  // --- Waypoints ---
  map.addSource('waypoints', { type: 'geojson', data: featureCollection([]) });
  map.addLayer({
    id: 'waypoints',
    type: 'circle',
    source: 'waypoints',
    paint: {
      'circle-radius': 6,
      'circle-color': '#fff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#3b82f6'
    }
  });

  // --- User Position ---
  map.addSource('userPosition', { type: 'geojson', data: point([0, 0]) });
  map.addLayer({
    id: 'userPosition',
    type: 'circle',
    source: 'userPosition',
    paint: {
      'circle-radius': 8,
      'circle-color': '#3b82f6',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  });

  // --- Territory ---
  map.addSource('territory', { type: 'geojson', data: featureCollection([]) });

  // ✅ Territory fill скрыт - используем 3D траву вместо заливки
  map.addLayer({
    id: 'territory-fill',
    type: 'fill',
    source: 'territory',
    layout: {
      'visibility': 'none' // ← Скрываем 2D заливку
    },
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'owner'], 'player'],
        '#10b981', // Зелёный (игрок)
        ['==', ['get', 'owner'], 'enemy'],
        '#ef4444', // Красный (враг)
        ['==', ['get', 'owner'], 'ally'],
        '#3b82f6', // Синий (союзник)
        '#9ca3af'  // Серый (нейтральный)
      ],
      'fill-opacity': 0.15
    }
  });

  map.addLayer({
    id: 'territory-outline',
    type: 'line',
    source: 'territory',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'owner'], 'player'],
        '#10b981', // Зелёный
        ['==', ['get', 'owner'], 'enemy'],
        '#ef4444', // Красный
        ['==', ['get', 'owner'], 'ally'],
        '#3b82f6', // Синий
        '#9ca3af'  // Серый
      ],
      'line-width': 2,
      'line-dasharray': [2, 2]
    }
  });

  // ========================================
  // ✅ SPHERES - Только базовая заливка
  // ========================================

  map.addSource('spheres', { type: 'geojson', data: featureCollection([]) });

  // Базовая заливка (фон сферы)
  map.addLayer({
    id: 'spheres-fill',
    type: 'fill',
    source: 'spheres',
    paint: {
      'fill-color': sphereColors.fillColor,
      'fill-opacity': sphereColors.fillOpacity
    }
  });
};

export const updateGeoJSONSource = (map: mapboxgl.Map, sourceId: string, data: GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry) => {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  
  // 🔍 DEBUG: Log source updates
  console.log(`[mapUtils] updateGeoJSONSource`, {
    sourceId,
    sourceExists: !!source,
    dataType: (data as any)?.type,
    hasCoordinates: !!(data as any)?.geometry?.coordinates?.length || (data as any)?.features?.length,
  });
  
  if (source) {
    source.setData(data);
  } else {
    console.warn(`[mapUtils] ⚠️ Source "${sourceId}" not found!`);
  }
};