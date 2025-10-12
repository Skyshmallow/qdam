// src/App.tsx
import { useCallback, useMemo, useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const mapController = useMapController(); 

  useDeviceOrientation(tracker.trackingState === 'recording');

  usePositionWatcher(
    tracker.trackingState === 'recording',
    (coords) => {
      setAvatarPosition(coords);
      tracker.addPathPoint(coords);
    }
  );

  // === Локальное состояние ===
  const [bases, setBases] = useState<Base[]>([]);
  const [simulationState, setSimulationState] = useState<
    'idle' | 'pickingStart' | 'pickingEnd' | 'ready' | 'simulating'
  >('idle');

  // === НОВЫЙ useEffect для управления курсором ===
  useEffect(() => {
    if (!map) return;

    const isPickingMode =
      simulationState === 'pickingStart' || simulationState === 'pickingEnd';
    
    // Получаем canvas карты и меняем его стиль
    map.getCanvas().style.cursor = isPickingMode ? 'crosshair' : '';

  }, [simulationState, map]);

  // === ОБРАБОТЧИКИ ===

  // --- "Find Me" ---
  const handleMyLocationClick = useCallback(async () => {
    console.log('%c[App.tsx]', 'color: #4CAF50; font-weight: bold;', 'handleMyLocationClick triggered.');
    if (geolocationState === 'success' && avatarPosition) {
      console.log('%c[App.tsx]', 'color: #4CAF50;', 'Geolocation is already successful. Resetting camera.');
      mapController.resetCamera();
      return;
    }

    const coords = await locateUser();
    console.log('%c[App.tsx]', 'color: #4CAF50;', 'await locateUser() finished. Received coords:', coords);

    if (coords) {
      setAvatarPosition(coords);
      console.log('%c[App.tsx]', 'color: #4CAF50;', 'Coords are valid. Calling setAvatarPosition.');
    } else {
      console.warn('%c[App.tsx]', 'color: #4CAF50;', 'Coords are null. No avatar position will be set.');
    }
  }, [locateUser, geolocationState, avatarPosition, setAvatarPosition, mapController]);

  // --- Симуляция (вынесена в отдельную функцию) ---
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

    mapController.resetCamera();
    tracker.startTracking(); 
  }, [
    simulationState,
    tracker,
    mapController,
    avatarPosition,
    handleStartSimulation,
  ]);

  // --- Остановка ---
  const handleStop = useCallback(() => {
    if (simulator.isSimulating) {
      simulator.stopSimulation();
    } else {
      tracker.stopTracking();
    }
    setSimulationState('idle');
    planner.resetPlanner();
    mapController.resetCamera();
    resetGeolocationState();
  }, [simulator, tracker, planner, mapController, resetGeolocationState]);

  // --- Симуляция ---
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
      <ToastContainer position="top-center" theme="dark" autoClose={2500} />
    </div>
  );
}

export default App;