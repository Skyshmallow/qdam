// A single GPS coordinate [longitude, latitude]
// Note: GeoJSON and Turf.js use [longitude, latitude] order
export type Coordinate = [number, number];

// A user's path, which is an array of coordinates
export type Path = Coordinate[];

// The structure for a single conquered territory saved in localStorage
export interface Territory {
  id: string;      // A unique ID, e.g., from Date.now()
  coords: Path;    // The closed path of the territory
  area: number;    // Calculated area in square meters
}