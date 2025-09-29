import React from 'react';
import Map, { Marker, Source, Layer, type LayerProps } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Coordinate, Path, Territory } from '../types';

// Mapbox layers styling
const conqueredLayerStyle: LayerProps = {
  id: 'conquered-area',
  type: 'fill',
  paint: { 'fill-color': '#4CAF50', 'fill-opacity': 0.3 },
};

const pathLayerStyle: LayerProps = {
  id: 'current-path',
  type: 'line',
  layout: { 'line-join': 'round', 'line-cap': 'round' },
  paint: { 'line-color': '#FF5722', 'line-width': 4, 'line-opacity': 0.8 },
};

interface MapProps {
  userPosition: Coordinate | null;
  currentPath: Path;
  territories: Territory[];
}

const MapComponent: React.FC<MapProps> = ({ userPosition, currentPath, territories }) => {
  const initialViewState = {
    longitude: userPosition ? userPosition[0] : -74.5,
    latitude: userPosition ? userPosition[1] : 40,
    zoom: 16,
  };

  // Convert current path to a GeoJSON feature for drawing
  const currentPathGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: currentPath,
    },
  };

  // Convert all conquered territories to a single GeoJSON feature collection
  const territoriesGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
    type: 'FeatureCollection',
    features: territories.map(t => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [t.coords], // Polygons require an extra array wrapper
      },
    })),
  };

  return (
    <Map
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={initialViewState}
      style={{ width: '100vw', height: '100vh' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      {/* Draw all conquered territories */}
      <Source type="geojson" data={territoriesGeoJSON}>
        <Layer {...conqueredLayerStyle} />
      </Source>
      
      {/* Draw the user's current walking path */}
      <Source type="geojson" data={currentPathGeoJSON}>
        <Layer {...pathLayerStyle} />
      </Source>
      
      {/* Show the user's current location as a marker */}
      {userPosition && (
        <Marker longitude={userPosition[0]} latitude={userPosition[1]} anchor="center">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        </Marker>
      )}
    </Map>
  );
};

export default MapComponent;
