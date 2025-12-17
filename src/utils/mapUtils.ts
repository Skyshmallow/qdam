import { featureCollection, point } from '@turf/helpers';

export const addMapLayers = (map: mapboxgl.Map) => {
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
      'fill-color': 'rgba(251, 191, 36, 0.1)', // Жёлтый полупрозрачный
      'fill-opacity': 0.15
    }
  });
};

export const updateGeoJSONSource = (map: mapboxgl.Map, sourceId: string, data: GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry) => {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  if (source) source.setData(data);
};