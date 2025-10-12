// src/App.tsx
import { useCallback, useMemo, useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import 'react-toastify/dist/ReactToastify.css';
import { Lock } from 'lucide-react';
import './App.css';

// --- Импорты ---
import { useMapStore } from './store/mapStore';
import { useMapController } from './hooks/useMapController';
import { useTracking } from './hooks/useTracking';
import { useSimulator } from './hooks/useSimulator';
import { useMapPlanner } from './hooks/useMapPlanner';
import { useGeolocation } from './hooks/useGeolocation'; 
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { usePositionWatcher } from './hooks/usePositionWatcher';

import { Map } from './components/Map';
import { TrackingControls } from './components/TrackingControls';
import { RightSidebar } from './ui/RightSidebar';
import { LeftSidebar } from './ui/LeftSideBar';

// --- Типы ---
import type { Base } from './types';

function App() {
  // === Состояние из глобального стора ===
  const { map, avatarPosition, bearing, setMap, setAvatarPosition, setBearing } = useMapStore();

  // === Хуки бизнес-логики ===
  const planner = useMapPlanner();
  const tracker = useTracking();
  const simulator = useSimulator();
  const { geolocationState, locateUser, resetGeolocationState } = useGeolocation();
  const { flyToAvatar } = useMapController(); 

  useDeviceOrientation(tracker.trackingState === 'recording');

  usePositionWatcher(
    tracker.trackingState === 'recording',
    (coords) => {
      setAvatarPosition(coords);
      tracker.addPathPoint(coords);
    }
  );

  // === Локальное состояние ===

  // === Базы и сферы ===
  const [bases, setBases] = useState<Base[]>([]);
  const [spheres, setSpheres] = useState<any>(turf.featureCollection([]));

  const [simulationState, setSimulationState] = useState<
    'idle' | 'pickingStart' | 'pickingEnd' | 'ready' | 'simulating'
  >('idle');
  
  // === УПРАВЛЕНИЕ КУРСОРОМ ===
  useEffect(() => {
    if (!map) return;
    const isPickingMode =
      simulationState === 'pickingStart' || simulationState === 'pickingEnd';
    map.getCanvas().style.cursor = isPickingMode ? 'crosshair' : '';
  }, [simulationState, map]);

  // === СЛЕЖЕНИЕ КАМЕРЫ ВО ВРЕМЯ СИМУЛЯЦИИ ===
  useEffect(() => {
    if (simulationState !== 'simulating' || !map || !avatarPosition) {
      return;
    }

    // Нормализуем bearing
    const normalizedBearing = (bearing + 360) % 360;

    // Вместо медленного easeTo, который конфликтует с частыми обновлениями
    map.setCenter(avatarPosition as [number, number]);
    map.setBearing(normalizedBearing);
    map.setPitch(60); // Поддерживаем 3D вид
    map.setZoom(17); // Поддерживаем зум
    
  }, [simulationState, map, avatarPosition, bearing]);

  // === УПРАВЛЕНИЕ ЖИЗНЕННЫМ ЦИКЛОМ БАЗ (для анимаций) ===
  useEffect(() => {
    // Ищем базы, которые нужно "устаканить"
    const newBasesExist = bases.some(b => b.status === 'new');

    if (newBasesExist) {
      // Через 100 миллисекунд (чтобы React успел отрендерить с классом анимации)
      // мы обновим их статус.
      const timer = setTimeout(() => {
        console.log('%c[App.tsx]', 'color: #4CAF50; font-weight: bold;', 'Changing status of new bases to "established".');
        setBases(currentBases =>
          currentBases.map(base =>
            base.status === 'new' ? { ...base, status: 'established' } : base
          )
        );
      }, 100); // Небольшая задержка

      return () => clearTimeout(timer); // Очистка таймера
    }
  }, [bases]);

  // === ГЕНЕРАЦИЯ СФЕР ВЛИЯНИЯ ===
  useEffect(() => {
    if (bases.length > 0) {
      console.log('%c[App.tsx]', 'color: #9C27B0; font-weight: bold;', 'Recalculating spheres of influence.');
      const radius = parseFloat(import.meta.env.VITE_SPHERE_RADIUS_KM || '0.5');

      const sphereFeatures = bases
        .map(base => {
          if (!base.coordinates) return undefined; // защита
          const center = turf.point(base.coordinates);
          const buffered = turf.buffer(center, radius, { units: 'kilometers' });
          return buffered;
        })
        .filter(
          (f): f is Feature<Polygon | MultiPolygon, GeoJsonProperties> => f !== undefined
        );

      setSpheres(turf.featureCollection(sphereFeatures));
    } else {
      setSpheres(turf.featureCollection([]));
    }
  }, [bases]);


  // === ОБРАБОТЧИКИ ===

  // --- "Find Me" ---
  const handleMyLocationClick = useCallback(async () => {
    const coords = await locateUser();
    if (coords) {
      // Сначала обновляем позицию
      setAvatarPosition(coords);
      flyToAvatar();
    }
  }, [locateUser, setAvatarPosition, flyToAvatar]);

  // --- Симуляция ---
  const handleStartSimulation = useCallback(() => {
    if (!planner.simulatableRoute) return;
    setSimulationState('simulating');
    tracker.clearCurrentPath();
    simulator.startSimulation(planner.simulatableRoute, (newCoords, newBearing) => {
      setAvatarPosition(newCoords);
      setBearing(newBearing);
    });
  }, [planner.simulatableRoute, simulator, tracker, setAvatarPosition, setBearing]);

  // --- Старт ---
  const handleStart = useCallback(() => {
    if (simulationState === 'ready') {
      handleStartSimulation();
      return;
    }

    if (!avatarPosition) {
      toast.info("Сначала определите ваше местоположение кнопкой 'Find Me'");
      return;
    }
    
    // При старте реального трекинга центрируемся на пользователе
    flyToAvatar();
    tracker.startTracking();
  }, [simulationState, tracker, flyToAvatar, avatarPosition, handleStartSimulation]);

  // --- Остановка ---
  const handleStop = useCallback(() => {
    let pathForBases: number[][] | null = null;

    if (simulator.isSimulating) {
      console.log('%c[App.tsx]', 'color: #FF9800; font-weight: bold;', 'Stopping SIMULATION.');
      simulator.stopSimulation();
      // Источник данных для баз - маршрут из планировщика
      pathForBases = planner.simulatableRoute;
    } else {
      console.log('%c[App.tsx]', 'color: #FF9800; font-weight: bold;', 'Stopping REAL tracking.');
      // Источник данных - записанный путь из трекера
      pathForBases = tracker.stopTracking();
    }

    // Общая логика создания баз, которая теперь работает для обоих случаев
    if (pathForBases && pathForBases.length >= 2) {
      console.log('%c[App.tsx]', 'color: #4CAF50; font-weight: bold;', 'Path is valid. Creating new bases.');
      const startPoint = pathForBases[0];
      const endPoint = pathForBases[pathForBases.length - 1];

      const newStartBase: Base = {
        id: Date.now(),
        coordinates: startPoint,
        status: 'new',
      };
      
      const newEndBase: Base = {
        id: Date.now() + 1,
        coordinates: endPoint,
        status: 'new',
      };

      setBases(prevBases => [...prevBases, newStartBase, newEndBase]);
    } else {
      console.warn('%c[App.tsx]', 'color: #F44336;', 'Path for bases is invalid or too short. No bases created.');
    }

    // Сброс всех состояний до начальных
    setSimulationState('idle');
    planner.resetPlanner();
    resetGeolocationState();
  }, [simulator, tracker, planner, resetGeolocationState]);

  // --- Клик на "Simulate" ---
  const handleSimulateClick = useCallback(() => {
    if (simulator.isSimulating) {
      toast.warn('Сначала остановите текущую симуляцию');
      return;
    }
    tracker.clearCurrentPath();
    planner.resetPlanner();
    setSimulationState('pickingStart');
    toast.info('Выберите начальную точку на карте');
  }, [planner, tracker, simulator.isSimulating]);

  // --- Клики по карте ---
  const handleMapClick = useCallback(
    async (coordinates: [number, number]) => {
      if (simulationState === 'pickingStart') {
        await planner.addWaypoint(coordinates);
        setSimulationState('pickingEnd');
        toast.info('Выберите конечную точку на карте');
      } else if (simulationState === 'pickingEnd') {
        await planner.addWaypoint(coordinates);
        setSimulationState('ready');
        toast.success('Маршрут построен. Нажмите Play.');
      }
    },
    [simulationState, planner]
  );

  // === ПРОПСЫ ===
  const mapProps = useMemo(
    () => ({
      avatarPosition,
      bearing,
      simulatableRoute: planner.simulatableRoute,
      currentPath: tracker.currentPath,
      onMapLoad: setMap,
      routeWaypoints: planner.routeWaypoints,
      bases,
      spheres,
      isDrawingMode:
        simulationState === 'pickingStart' || simulationState === 'pickingEnd',
      onMapClick: handleMapClick,
    }),
    [
      avatarPosition,
      bearing,
      setMap,
      planner.simulatableRoute,
      tracker.currentPath,
      planner.routeWaypoints,
      bases,
      spheres,
      simulationState,
      handleMapClick,
    ]
  );

  const trackingControlsProps = useMemo(
    () => ({
      trackingState: tracker.trackingState,
      simulationState,
      onStart: handleStart,
      onPause: tracker.pauseTracking,
      onResume: tracker.resumeTracking,
      onStop: handleStop,
      onSimulateClick: handleSimulateClick,
    }),
    [
      tracker.trackingState,
      simulationState,
      handleStart,
      tracker.pauseTracking,
      tracker.resumeTracking,
      handleStop,
      handleSimulateClick,
    ]
  );

  const rightSidebarProps = useMemo(
    () => ({ onMyLocationClick: handleMyLocationClick }),
    [handleMyLocationClick]
  );

  const leftSidebarProps = useMemo(
    () => ({
      onProfileClick: () =>
        toast.info('Profile page is not implemented yet.'),
      onHistoryClick: () =>
        toast.info('History page is not implemented yet.'),
      geolocationState: geolocationState,
      onMyLocationClick: handleMyLocationClick,
    }),
    [geolocationState, handleMyLocationClick]
  );

  // === UI ===
  return (
    <div className="w-screen h-screen relative">
      <Map {...mapProps} />
      <LeftSidebar {...leftSidebarProps} />
      <TrackingControls {...trackingControlsProps} />
      <RightSidebar {...rightSidebarProps} />
      
      {/* Индикатор блокировки карты */}
      {simulationState === 'simulating' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-20">
          <Lock size={14} />
          <span>Режим симуляции: управление картой ограничено</span>
        </div>
      )}

      <ToastContainer position="top-center" theme="dark" autoClose={2500} />
    </div>
  );
}

export default App;