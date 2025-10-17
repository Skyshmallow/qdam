import * as turf from '@turf/turf';

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
  map.addSource('waypoints', { type: 'geojson', data: turf.featureCollection([]) });
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
  map.addSource('userPosition', { type: 'geojson', data: turf.point([0, 0]) });
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
  map.addSource('territory', { type: 'geojson', data: turf.featureCollection([]) });

  map.addLayer({
  id: 'territory-fill',
  type: 'fill',
  source: 'territory',
  paint: {
    // ✅ Динамический цвет: синий для постоянной, жёлтый для тестовой
    'fill-color': [
      'case',
      ['get', 'isTemporary'],
      '#fbbf24', // жёлтый для тестовой территории
      '#3b82f6'  // синий для постоянной
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
      ['get', 'isTemporary'],
      '#fbbf24', // жёлтый
      '#60a5fa'  // синий
    ],
    'line-width': 2,
    'line-dasharray': [
      'case',
      ['get', 'isTemporary'],
      ['literal', [4, 2]], // пунктирная для тестовой
      ['literal', [2, 2]]  // обычная
    ]
  }
});

  // --- Spheres (Enhanced with gradient) ---
  map.addSource('spheres', { type: 'geojson', data: turf.featureCollection([]) });
  
  map.addLayer({
    id: 'spheres-fill',
    type: 'fill',
    source: 'spheres',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'fill-opacity'],
        0, '#001a33',
        0.5, '#0066cc',
        1, '#00d4ff'
      ],
      'fill-opacity': ['get', 'fill-opacity'],
    }
  });

  map.addLayer({
    id: 'spheres-outline',
    type: 'line',
    source: 'spheres',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': [
        'match',
        ['get', 'ring'],
        'inner', '#00ffff',
        'middle', '#0099ff',
        'outer', '#0066cc',
        '#007cbf'
      ],
      'line-width': ['get', 'pulse-width'],
      'line-opacity': ['get', 'pulse-opacity'],
      'line-blur': 2
    }
  });

  map.addLayer({
    id: 'spheres-glow',
    type: 'line',
    source: 'spheres',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#00ffff',
      'line-width': ['*', ['get', 'pulse-width'], 1.5],
      'line-opacity': ['*', ['get', 'pulse-opacity'], 0.3],
      'line-blur': 6
    }
  });
};

export const updateGeoJSONSource = (map: mapboxgl.Map, sourceId: string, data: any) => {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  if (source) source.setData(data);
};