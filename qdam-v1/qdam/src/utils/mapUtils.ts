// src/utils/mapUtils.ts
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

export const addMapLayers = (map: mapboxgl.Map) => {
  const emptyLine = {
    'type': 'Feature' as const,
    'geometry': {
      'type': 'LineString' as const,
      'coordinates': []
    },
    'properties': {}
  };

  // Planned route (gray, background)
  map.addSource('route', { type: 'geojson', data: emptyLine });
  map.addLayer({
    id: 'route', type: 'line', source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#888888', // Changed to gray
      'line-width': 5,
      'line-opacity': 0.8
    }
  });

  // Recorded GPS track (red, foreground, thicker)
  map.addSource('recordedPath', { type: 'geojson', data: emptyLine });
  map.addLayer({
    id: 'recordedPath', type: 'line', source: 'recordedPath',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 
      'line-color': '#e53e3e', 
      'line-width': 7 // Made thicker to visually cover the gray route
    }
  }, 'route'); // Ensure this layer is drawn above the 'route' layer

  // Waypoints
  map.addSource('waypoints', { type: 'geojson', data: turf.featureCollection([]) });
  map.addLayer({
    id: 'waypoints', type: 'circle', source: 'waypoints',
    paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': '#3b82f6' }
  });

  // Custom simulation avatar (our main actor)
  map.addSource('userPosition', { type: 'geojson', data: turf.point([0, 0]) });
  map.addLayer({
    id: 'userPosition', type: 'circle', source: 'userPosition',
    paint: { 
      'circle-radius': 8, // Slightly bigger circle
      'circle-color': '#3b82f6', 
      'circle-stroke-width': 2, // White stroke
      'circle-stroke-color': '#ffffff' 
    }
  });

  // Bases and Spheres 
  map.addSource('bases', { type: 'geojson', data: turf.featureCollection([]) });
  map.addLayer({
    id: 'bases', type: 'circle', source: 'bases',
    paint: { 'circle-radius': 8, 'circle-color': '#ffffff', 'circle-stroke-width': 2, 'circle-stroke-color': '#007cbf' }
  });
  
  map.addSource('spheres', { type: 'geojson', data: turf.featureCollection([]) });
  map.addLayer({
    id: 'spheres', type: 'fill', source: 'spheres',
    paint: { 'fill-color': '#007cbf', 'fill-opacity': 0.2, 'fill-outline-color': '#007cbf' }
  });
};

// Update function (no changes here)
export const updateGeoJSONSource = (map: mapboxgl.Map, sourceId: string, data: any) => {
    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
        source.setData(data);
    }
}