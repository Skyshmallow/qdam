// src/api/mapboxAPI.ts
import mapboxgl from 'mapbox-gl';

/**
 * Асинхронная функция для получения маршрута от Mapbox Directions API.
 * @param waypoints - Массив опорных точек [[lng, lat], ...].
 * @param signal - AbortSignal для отмены запроса
 * @returns Промис, который разрешается в массив координат маршрута или null в случае ошибки.
 */
export const fetchRoute = async (
  waypoints: number[][], 
  signal?: AbortSignal
): Promise<number[][] | null> => {
  // Запрос не имеет смысла, если точек меньше двух
  if (waypoints.length < 2) {
    return null;
  }

  // Преобразуем массив координат в строку для URL
  const coordinates = waypoints.map(p => p.join(',')).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    // Проверяем, что API вернуло валидный маршрут
    if (data.routes && data.routes.length > 0) {
      const routeCoordinates = data.routes[0].geometry.coordinates;
      return routeCoordinates;
    }
    return null;
  } catch (error) {
    console.error("Ошибка при получении маршрута от Mapbox API:", error);
    return null;
  }
};