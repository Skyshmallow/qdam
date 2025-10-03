// src/components/Map.tsx

import { useRef, useEffect, useState, useCallback } from 'react'; 
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Feature, LineString } from 'geojson'; 

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const INITIAL_LNG = 76.9286;
const INITIAL_LAT = 43.2567;
const INITIAL_ZOOM = 10;

type TrackingState = 'idle' | 'recording' | 'paused';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(INITIAL_LNG);
  const [lat, setLat] = useState(INITIAL_LAT);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');

  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  
  const watchIdRef = useRef<number | null>(null);

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

  const handleStart = () => {
    console.log("Начинаем запись...");
    setCurrentPath([]);
    setTrackingState('recording');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        // Добавляем новую точку в маршрут, только если идет запись
        // Используем функциональное обновление, чтобы всегда иметь доступ к последней версии state
        setCurrentPath(prevPath => [...prevPath, [longitude, latitude]]);
        // Плавно перемещаем карту, чтобы пользователь всегда был в центре
        map.current?.panTo([longitude, latitude]);
      },
      (error) => {
        console.error("Ошибка геолокации:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handlePause = () => {
    console.log("Запись на паузе.");
    setTrackingState('paused');
  };

  const handleResume = () => {
    console.log("Продолжаем запись...");
    setTrackingState('recording');
  };

  const handleStop = () => {
    console.log("Запись остановлена.");
    setTrackingState('idle');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    if (map.current) return;
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: zoom
      });

      // Добавляем контролы на карту
      map.current.addControl(new mapboxgl.GeolocateControl({ /* ... */ }), 'bottom-right');

      // Ждем, пока карта полностью загрузится, чтобы добавить наши слои
      map.current.on('load', () => {
        // НОВЫЙ КОД: Создаем источник данных и слой для отрисовки маршрута
        map.current?.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': []
            }
          }
        });

        map.current?.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#3b82f6', // Синий цвет линии
            'line-width': 5,
            'line-opacity': 0.8
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Этот эффект будет срабатывать каждый раз, когда меняется currentPath
    if (!map.current || !map.current.isStyleLoaded()) {
      return; // Убедимся, что карта готова
    }

    // Получаем источник данных 'route' с карты
    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      // Создаем GeoJSON объект из нашего массива координат
      const data: Feature<LineString> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: currentPath,
        },
      };
      // Обновляем данные в источнике, что приводит к перерисовке линии
      source.setData(data);
    }
    // Проверяем, что состояние 'recording' перед добавлением новой точки, 
    // чтобы избежать добавления точки после паузы
  }, [currentPath, trackingState]); 

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="sidebar">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      
      {/* Кнопка ре-центра остается */}
      <button onClick={recenterMap} className="recenter-button" title="Recenter Map">
        🎯
      </button>

      {/* НОВЫЙ БЛОК: Панель управления записью */}
      <div className="tracking-controls">
        {trackingState === 'idle' && (
          <button onClick={handleStart} className="control-button start-button">
            Старт
          </button>
        )}

        {trackingState === 'recording' && (
          <>
            <button onClick={handlePause} className="control-button pause-button">
              Пауза
            </button>
            <button onClick={handleStop} className="control-button stop-button">
              Стоп
            </button>
          </>
        )}

        {trackingState === 'paused' && (
          <>
            <button onClick={handleResume} className="control-button resume-button">
              Продолжить
            </button>
            <button onClick={handleStop} className="control-button stop-button">
              Стоп
            </button>
          </>
        )}
      </div>

      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default Map;