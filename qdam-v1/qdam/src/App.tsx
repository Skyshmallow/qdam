import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import { Lock } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

// --- Imports ---
import { useMapStore } from './store/mapStore';
import { useNotificationStore } from './store/notificationStore';
import { useUIStore } from './store/uiStore';
import { useMapController } from './hooks/useMapController';
import { useSimulator } from './hooks/useSimulator';
import { useMapPlanner } from './hooks/useMapPlanner';
import { useGeolocation } from './hooks/useGeolocation';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { usePositionWatcher } from './hooks/usePositionWatcher';
import { useChainAttempt } from './hooks/useChainAttempt';
import { usePlayerStats } from './hooks/usePlayerStats';
import { useZoom } from './hooks/useZoom';
import { ThreeLayer } from './utils/ThreeLayer';

// NEW: Simulation mode
import { useSimulationMode } from './simulation/useSimulationMode';

// NEW: Utils
import { saveNodes, saveChains, loadNodes, loadChains } from './utils/storage';
import { canCreateChainToday, canStartChain, isValidPath } from './utils/gameRules';
import { createChainFromPath } from './utils/chainFactory';

import { Map } from './components/Map';
import { TrackingControls } from './components/TrackingControls';
import { RightSidebar } from './ui/RightSidebar';
import { LeftSidebar } from './ui/LeftSideBar';
import { ZoomIndicator } from './ui/ZoomIndicator';

// NEW: Notification System & Overlays
import { NotificationContainer } from './ui/notifications/NotificationContainer';
import { ProfileOverlay } from './ui/overlays/ProfileOverlay';
import { HistoryOverlay } from './ui/overlays/HistoryOverlay';
import { LayersOverlay } from './ui/overlays/LayersOverlay';

// --- Types ---
import type { Node, Chain } from './types';

// --- Activity State ---
type ActivityState =
  | 'idle'
  | 'tracking'
  | 'tracking_paused'
  | 'planning_start'
  | 'planning_end'
  | 'ready_to_simulate'
  | 'simulating';

function App() {
  // === Global Store State ===
  const { map, avatarPosition, bearing, setMap, setAvatarPosition, setBearing } = useMapStore();
  const { showSuccess, showError, showWarning, showInfo } = useNotificationStore();
  const { activeOverlay, openOverlay, closeOverlay } = useUIStore();

  // === Business Logic Hooks ===
  const planner = useMapPlanner();
  const simulator = useSimulator();
  const { geolocationState, locateUser, resetGeolocationState } = useGeolocation();
  const { flyToAvatar } = useMapController();
  const { zoomIn, zoomOut } = useZoom();
  const threeLayerRef = useRef<ThreeLayer | null>(null);
  const chainAttempt = useChainAttempt();
  const playerStats = usePlayerStats();
  
  // NEW: Simulation mode
  const simulation = useSimulationMode();

  // Logging helper
  const log = useCallback((step: string, details?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = simulation.isSimulationMode ? '[SIMULATION]' : '[App]';
    if (details) {
      console.log(`[${timestamp}]${prefix} ${step}`, details);
    } else {
      console.log(`[${timestamp}]${prefix} ${step}`);
    }
  }, [simulation.isSimulationMode]);



  // === Local State ===
  const [nodes, setNodes] = useState<Node[]>([]);
  const [chains, setChains] = useState<Chain[]>([]);
  const [spheres, setSpheres] = useState<any>(turf.featureCollection([]));
  const [activityState, setActivityState] = useState<ActivityState>('idle');
  const [territory, setTerritory] = useState<Feature<Polygon> | null>(null);
  const isInitialLoadDone = useRef(false);
  const [isFollowingAvatar, setIsFollowingAvatar] = useState(false);
  const [isThreeLayerReady, setIsThreeLayerReady] = useState(false);

  // === Load data from localStorage on mount ===
  useEffect(() => {
    log('Loading initial data from localStorage');
    
    try {
      const savedNodes = loadNodes();
      const savedChains = loadChains();

      if (savedNodes.length > 0) {
        setNodes(savedNodes);
        log('Loaded nodes', { count: savedNodes.length });
      }

      if (savedChains.length > 0) {
        setChains(savedChains);
        log('Loaded chains', { count: savedChains.length });
      }
      
      isInitialLoadDone.current = true;
      log('Initial data load complete');
      
    } catch (error) {
      console.error('[App] Failed to load from storage', error);
      isInitialLoadDone.current = true;
    }
  }, [log]);

  // === Save nodes/chains to localStorage (with simulation filter) ===
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    
    saveNodes(nodes, simulation.isSimulationMode);
  }, [nodes, simulation.isSimulationMode]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    
    saveChains(chains, simulation.isSimulationMode);
  }, [chains, simulation.isSimulationMode]);

  // Anti-cheat handler
  const handleCheatDetected = useCallback(() => {
    log('Cheat detected - stopping chain attempt');
    showError('Скорость превышает допустимую для ходьбы!');
    chainAttempt.clearAttempt();
    setActivityState('idle');
  }, [chainAttempt, log]);

  // ✅ Position watcher - only when chain attempt active (real walk only)
  usePositionWatcher(
    !!chainAttempt.currentAttempt && !simulation.isSimulationMode,
    (coords) => {
      setAvatarPosition(coords);
      chainAttempt.addPointToAttempt(coords as [number, number]);
    },
    handleCheatDetected
  );

  // ✅ Device orientation - only when tracking (real walk only)
  useDeviceOrientation(!!chainAttempt.currentAttempt && !simulation.isSimulationMode);

  // Log activity state changes
  useEffect(() => {
    log('Activity state changed', { state: activityState });
  }, [activityState, log]);

  // Log chains/nodes changes
  useEffect(() => {
    if (chains.length > 0 || nodes.length > 0) {
      log('Storage updated', { 
        chains: chains.length, 
        nodes: nodes.length,
        temporary: nodes.filter(n => n.isTemporary).length
      });
    }
  }, [chains, nodes, log]);

  // === MAP LOAD ===
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    setMap(loadedMap);
    log('Map loaded');
    loadedMap.setPitch(60);
  }, [setMap, log]);

  // === ThreeLayer ready ===
  const handleThreeLayerReady = useCallback((threeLayer: ThreeLayer) => {
    log('ThreeLayer ready, storing reference');
    threeLayerRef.current = threeLayer;
    setIsThreeLayerReady(true);
  }, [log]);

  // === Update 3D castles when chains change ===
  useEffect(() => {
    if (!threeLayerRef.current || !isThreeLayerReady || !isInitialLoadDone.current) {
      log('Waiting for ThreeLayer or initial data load', {
        hasThreeLayer: !!threeLayerRef.current,
        isReady: isThreeLayerReady,
        isDataLoaded: isInitialLoadDone.current
      });
      return;
    }
    
    if (chains.length === 0) {
      log('No chains to display');
      threeLayerRef.current.setChains([]);
      return;
    }
    
    const chainsData = chains.map(chain => {
      const nodeA = nodes.find(n => n.id === chain.nodeA_id);
      const nodeB = nodes.find(n => n.id === chain.nodeB_id);
      
      if (!nodeA || !nodeB) {
        console.warn('[App] Chain has missing nodes', { chainId: chain.id });
        return null;
      }
      
      return {
        id: parseInt(chain.id.slice(0, 8), 36),
        start: nodeA.coordinates,
        end: nodeB.coordinates,
        startCoords: nodeA.coordinates,
        endCoords: nodeB.coordinates
      };
    }).filter(Boolean);
    
    log('Updating 3D layer with chains', { count: chainsData.length });
    threeLayerRef.current.setChains(chainsData as any);
  }, [chains, nodes, isThreeLayerReady, log]);

  // === CURSOR ===
  useEffect(() => {
    if (!map) return;
    const isPickingMode = activityState === 'planning_start' || activityState === 'planning_end';
    map.getCanvas().style.cursor = isPickingMode ? 'crosshair' : '';
  }, [activityState, map]);

  // === CAMERA FOLLOW DURING SIMULATION ===
  useEffect(() => {
    if (!isFollowingAvatar || activityState !== 'simulating' || !map || !avatarPosition) return;

    const normalizedBearing = (bearing + 360) % 360;
    map.easeTo({
      center: avatarPosition as [number, number],
      bearing: normalizedBearing,
      pitch: 60,
      zoom: 17,
      duration: 300,
      essential: true
    });
  }, [isFollowingAvatar, activityState, map, avatarPosition, bearing]);

  // ✅ Auto-enable follow when simulation starts
  useEffect(() => {
    if (activityState === 'simulating') {
      setIsFollowingAvatar(true);
    } else if (activityState === 'idle') {
      setIsFollowingAvatar(false);
    }
  }, [activityState]);

  // ✅ Disable follow when user manually interacts with map
  useEffect(() => {
    if (!map || activityState !== 'simulating') return;

    const disableFollow = () => {
      setIsFollowingAvatar(false);
    };

    map.on('dragstart', disableFollow);
    map.on('zoomstart', disableFollow);
    map.on('pitchstart', disableFollow);
    map.on('rotatestart', disableFollow);

    return () => {
      map.off('dragstart', disableFollow);
      map.off('zoomstart', disableFollow);
      map.off('pitchstart', disableFollow);
      map.off('rotatestart', disableFollow);
    };
  }, [map, activityState]);

  // === TERRITORY CALCULATION (Convex Hull) ===
  useEffect(() => {
    const allEstablishedNodes = nodes.filter(node => node.status === 'established');

    if (allEstablishedNodes.length < 4) {
      setTerritory(null); // ✅ Убираем территорию
      return;
    }

    try {
      const points = turf.featureCollection(
        allEstablishedNodes.map(node => turf.point(node.coordinates))
      );

      const hull = turf.convex(points);

      if (hull && hull.geometry.type === 'Polygon') {
        const hasTemporaryNodes = allEstablishedNodes.some(n => n.isTemporary);
        
        hull.properties = {
          ...hull.properties,
          owner: 'player1',
          isTemporary: hasTemporaryNodes,
        };
        
        setTerritory(hull);
        log('Territory recalculated', { 
          totalNodes: allEstablishedNodes.length,
          permanent: allEstablishedNodes.filter(n => !n.isTemporary).length,
          temporary: allEstablishedNodes.filter(n => n.isTemporary).length,
          isTemporary: hasTemporaryNodes,
        });
      } else {
        setTerritory(null);
        console.warn('[App] Convex hull result is not a Polygon', hull);
      }
    } catch (error) {
      console.error('[App] Error calculating convex hull:', error);
    }

  }, [nodes, log]);

  // === SPHERE GENERATION (Enhanced with rings) ===
  useEffect(() => {
    if (chains.length > 0) {
      const radius = parseFloat(import.meta.env.VITE_SPHERE_RADIUS_KM || '0.5');
      const sphereFeatures: Feature<Polygon | MultiPolygon, GeoJsonProperties>[] = [];
      
      chains.forEach((chain, chainIndex) => {
        const nodeA = nodes.find(n => n.id === chain.nodeA_id);
        const nodeB = nodes.find(n => n.id === chain.nodeB_id);
        
        if (!nodeA || !nodeB) return;
        
        [nodeA.coordinates, nodeB.coordinates].forEach((coords, pointIndex) => {
          const center = turf.point(coords);
          const baseId = `${chain.id}-${pointIndex === 0 ? 'start' : 'end'}`;
          
          // Outer ring
          const outerRing = turf.buffer(center, radius * 1.2, { units: 'kilometers', steps: 64 });
          if (outerRing) {
            outerRing.properties = {
              ...outerRing.properties,
              id: `${baseId}-outer`,
              ring: 'outer',
              chainIndex,
              pointIndex,
              'pulse-width': 1,
              'pulse-opacity': 0.15,
              'fill-opacity': 0.05,
            };
            sphereFeatures.push(outerRing);
          }
          
          // Middle ring
          const middleRing = turf.buffer(center, radius * 0.8, { units: 'kilometers', steps: 64 });
          if (middleRing) {
            middleRing.properties = {
              ...middleRing.properties,
              id: `${baseId}-middle`,
              ring: 'middle',
              chainIndex,
              pointIndex,
              'pulse-width': 2,
              'pulse-opacity': 0.3,
              'fill-opacity': 0.08,
            };
            sphereFeatures.push(middleRing);
          }
          
          // Inner ring
          const innerRing = turf.buffer(center, radius * 0.5, { units: 'kilometers', steps: 64 });
          if (innerRing) {
            innerRing.properties = {
              ...innerRing.properties,
              id: `${baseId}-inner`,
              ring: 'inner',
              chainIndex,
              pointIndex,
              'pulse-width': 3,
              'pulse-opacity': 0.6,
              'fill-opacity': 0.15,
            };
            sphereFeatures.push(innerRing);
          }
        });
      });
      
      setSpheres(turf.featureCollection(sphereFeatures));
    } else {
      setSpheres(turf.featureCollection([]));
    }
  }, [chains, nodes]);

  // === SPHERE PULSE ANIMATION ===
  useEffect(() => {
    if (!map || spheres.features.length === 0) return;

    let animationFrameId: number;
    const source = map.getSource('spheres') as mapboxgl.GeoJSONSource;

    const animate = (timestamp: number) => {
      const time = timestamp / 1000;

      const updatedFeatures = spheres.features.map((feature: any) => {
        const ring = feature.properties.ring;
        const chainIndex = feature.properties.chainIndex || 0;
        const pointIndex = feature.properties.pointIndex || 0;
        
        let phaseOffset = 0;
        if (ring === 'outer') phaseOffset = 0;
        if (ring === 'middle') phaseOffset = Math.PI * 0.66;
        if (ring === 'inner') phaseOffset = Math.PI * 1.33;
        
        const totalOffset = phaseOffset + (chainIndex * 0.5) + (pointIndex * 0.25);
        const pulseValue = Math.sin(time * 2 + totalOffset);
        const normalizedPulse = (pulseValue + 1) / 2;

        let minWidth = 1, maxWidth = 3;
        let minOpacity = 0.2, maxOpacity = 0.8;
        let minFillOpacity = 0.05, maxFillOpacity = 0.2;
        
        if (ring === 'outer') {
          maxWidth = 2;
          maxOpacity = 0.4;
          maxFillOpacity = 0.1;
        } else if (ring === 'middle') {
          maxWidth = 3;
          maxOpacity = 0.6;
          maxFillOpacity = 0.15;
        } else if (ring === 'inner') {
          maxWidth = 4;
          maxOpacity = 1.0;
          maxFillOpacity = 0.25;
        }

        const currentWidth = minWidth + (maxWidth - minWidth) * normalizedPulse;
        const currentOpacity = minOpacity + (maxOpacity - minOpacity) * normalizedPulse;
        const currentFillOpacity = minFillOpacity + (maxFillOpacity - minFillOpacity) * normalizedPulse;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            'pulse-width': currentWidth,
            'pulse-opacity': currentOpacity,
            'fill-opacity': currentFillOpacity,
          }
        };
      });

      const updatedSpheres = turf.featureCollection(updatedFeatures);
      if (source) source.setData(updatedSpheres);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [map, spheres]);

  // === EVENT HANDLERS ===
  
  const handleMyLocationClick = useCallback(async () => {
    const coords = await locateUser();
    if (coords) {
      setAvatarPosition(coords);
      flyToAvatar();
    }
  }, [locateUser, setAvatarPosition, flyToAvatar]);

  // ✅ NEW: handleStop - Works for both real walk and simulation
  const handleStop = useCallback(() => {
    log('handleStop called', { 
      hasAttempt: !!chainAttempt.currentAttempt,
      activityState,
      isSimulation: simulation.isSimulationMode
    });
    
    // Stop simulation
    if (activityState === 'simulating') {
      log('Stopping simulation');
      simulator.stopSimulation();
      
      // NEW: Create chain from simulation route
      if (planner.routeWaypoints.length >= 2 && planner.simulatableRoute) {
        const startCoords = planner.routeWaypoints[0] as [number, number];
        const endCoords = planner.routeWaypoints[planner.routeWaypoints.length - 1] as [number, number];
        
        // ✅ FIX: Use simulation.isSimulationMode instead of hardcoded true
        const { nodeA, nodeB, chain } = createChainFromPath(
          startCoords,
          endCoords,
          planner.simulatableRoute,
          simulation.isSimulationMode // ✅ FIXED: Was hardcoded `true`
        );
        
        setNodes(prev => [...prev, nodeA, nodeB]);
        setChains(prev => [...prev, chain]);
        
        showSuccess(
          simulation.isSimulationMode
            ? 'Симуляция завершена! Замки созданы (временные).'
            : 'Симуляция завершена! Замки созданы.'
        );
      }
      
      planner.resetPlanner();
      setActivityState('idle');
      resetGeolocationState();
      return;
    }

    // Stop chain tracking (real walk)
    if (!chainAttempt.currentAttempt || !avatarPosition) {
      log('Cannot stop - no active attempt or avatar position');
      return;
    }

    const { nodeA, path } = chainAttempt.currentAttempt;

    // Validate path
    const pathValidation = isValidPath(path);
    if (!pathValidation.allowed) {
      showWarning(pathValidation.reason || 'Путь слишком короткий для создания цепочки');
      chainAttempt.clearAttempt();
      setActivityState('idle');
      return;
    }

    const startCoords = nodeA.coordinates as [number, number];
    const endCoords = avatarPosition as [number, number];

    // Create chain (permanent in real mode, temporary in simulation mode)
    const { nodeA: finalNodeA, nodeB, chain: newChain } = createChainFromPath(
      startCoords,
      endCoords,
      path,
      simulation.isSimulationMode // isTemporary
    );
    
    // Update state
    setNodes(prev => {
      // Remove old pending nodeA, add both final nodes
      const filtered = prev.filter(n => n.id !== nodeA.id);
      return [...filtered, finalNodeA, nodeB];
    });
    setChains(prev => [...prev, newChain]);

    // Clear attempt
    chainAttempt.clearAttempt();
    setActivityState('idle');
    resetGeolocationState();

    // Update player stats (only in real mode)
    if (!simulation.isSimulationMode) {
      playerStats.incrementChainsCreated();
    }

    log('Chain created successfully', {
      chainId: newChain.id,
      pathLength: path.length,
      nodeA: finalNodeA.id,
      nodeB: nodeB.id,
      isTemporary: simulation.isSimulationMode
    });

    showSuccess(
      simulation.isSimulationMode 
        ? 'Цепочка создана (тестовая, не сохранится)!' 
        : 'Цепочка успешно создана!'
    );

  }, [
    chainAttempt, 
    avatarPosition, 
    activityState, 
    simulator, 
    planner, 
    resetGeolocationState,
    playerStats,
    simulation.isSimulationMode,
    log
  ]);

  const handleStartSimulation = useCallback(() => {
    if (!planner.simulatableRoute) {
      log('Cannot start simulation - no route available');
      return;
    }
    log('Starting simulation', { routeLength: planner.simulatableRoute.length });
    setActivityState('simulating');
    
    simulator.startSimulation(
      planner.simulatableRoute,
      (newCoords, newBearing) => {
        setAvatarPosition(newCoords);
        setBearing(newBearing);
      },
      () => {
        log('Simulation movement completed (auto-stop disabled)');
        // Don't auto-stop - let user click Stop to create castles
      }
    );
  }, [planner, simulator, setAvatarPosition, setBearing, log]);

  // ✅ NEW: handleStart - Works for both real walk and simulation
  const handleStart = useCallback(() => {
    log('handleStart called', { 
      currentState: activityState,
      isSimulation: simulation.isSimulationMode
    });
    
    // If ready to simulate, start simulation
    if (activityState === 'ready_to_simulate') {
      handleStartSimulation();
      return;
    }
    
    // Only start from idle
    if (activityState !== 'idle') {
      log('Cannot start - not in idle state');
      return;
    }

    // Check avatar position
    if (!avatarPosition) {
      log('Cannot start - no avatar position');
      showInfo("Сначала определите ваше местоположение кнопкой 'Find Me'");
      return;
    }

    // Block if already has active attempt
    if (chainAttempt.currentAttempt) {
      const info = chainAttempt.getAttemptInfo();
      if (info) {
        log('Active attempt found', info);
        showWarning(`У вас уже есть незавершенный поход (${info.durationMinutes} мин назад)`);
      } else {
        log('Active attempt found (no info available)');
        showWarning('У вас уже есть незавершенный поход');
      }
      setActivityState('tracking');
      return;
    }

    // Check daily limit (skip in simulation mode)
    if (!canCreateChainToday(playerStats.chainsCreatedToday, simulation.isSimulationMode)) {
      showError(`Вы достигли дневного лимита (${playerStats.maxChainsPerDay} цепочек в день)`);
      return;
    }

    // Check sphere of influence
    const sphereCheck = canStartChain(
      avatarPosition as [number, number],
      nodes,
      chains,
      simulation.isSimulationMode
    );
    
    if (!sphereCheck.allowed) {
      log('Sphere check failed', { reason: sphereCheck.reason });
      showError(sphereCheck.reason || 'Cannot start chain outside sphere of influence');
      return;
    }

    log('Starting new chain attempt');
    chainAttempt.startAttempt(avatarPosition as [number, number]);
    flyToAvatar();
    setActivityState('tracking');
    showSuccess(
      simulation.isSimulationMode 
        ? 'Начат тестовый поход!' 
        : 'Начат новый поход!'
    );

  }, [
    activityState, 
    avatarPosition, 
    chainAttempt,
    chains,
    nodes,
    playerStats,
    simulation.isSimulationMode,
    flyToAvatar, 
    handleStartSimulation, 
    log
  ]);

  const handlePause = useCallback(() => {
    log('Pause clicked');
    setActivityState('tracking_paused');
    showInfo('Поход приостановлен');
  }, [log]);

  const handleResume = useCallback(() => {
    log('Resume clicked');
    setActivityState('tracking');
    showInfo('Поход возобновлен');
  }, [log]);

  // ✅ handleSimulateClick - Don't clear active chain
  const handleSimulateClick = useCallback(() => {
    log('Simulate button clicked', { 
      isSimulating: simulation.isSimulationMode,
      activityState 
    });
    
    // If simulation is active, exit it (Variant A: just exit)
    if (simulation.isSimulationMode) {
      log('Exiting simulation mode');
      
      // If in middle of planning/simulating, reset it
      if (activityState !== 'idle') {
        simulator.stopSimulation();
        planner.resetPlanner();
        setActivityState('idle');
        resetGeolocationState();
      }
      
      simulation.exitSimulationMode();
      showInfo('Режим симуляции выключен');
      return;
    }
    
    // Block if real walk is active
    if (chainAttempt.currentAttempt) {
      showError('Сначала завершите текущий реальный поход!');
      return;
    }
    
    // Enter simulation mode and start planning
    log('Entering simulation mode');
    simulation.enterSimulationMode();
    planner.resetPlanner();
    setActivityState('planning_start');
    showInfo('🧪 Режим симуляции активирован! Выберите начальную точку на карте');
    
  }, [
    simulation, 
    activityState, 
    chainAttempt, 
    simulator, 
    planner, 
    resetGeolocationState,
    log
  ]);

  const handleMapClick = useCallback(async (coordinates: [number, number]) => {
    log('Map clicked', { 
      coordinates, 
      activityState,
      isDrawingMode: activityState === 'planning_start' || activityState === 'planning_end'
    });

    if (activityState === 'planning_start') {
      // Check sphere of influence
      const sphereCheck = canStartChain(
        coordinates,
        nodes,
        chains,
        simulation.isSimulationMode
      );
      
      if (!sphereCheck.allowed) {
        showError(sphereCheck.reason || 'Cannot plan route outside sphere of influence');
        return;
      }

      await planner.addWaypoint(coordinates);
      setActivityState('planning_end');
      showInfo('Выберите конечную точку на карте');

    } else if (activityState === 'planning_end') {
      await planner.addWaypoint(coordinates);
      setActivityState('ready_to_simulate');
      showSuccess('Маршрут построен. Нажмите Play для запуска симуляции.');
    }
  }, [activityState, planner, chains, nodes, simulation.isSimulationMode, log]);

  // === PROPS ===
  const mapProps = useMemo(() => {
    // Combine established nodes + pending node from current attempt
    const allNodesForMap = [...nodes];
    if (chainAttempt.currentAttempt) {
      allNodesForMap.push(chainAttempt.currentAttempt.nodeA);
    }
    
    // Current path from attempt or empty
    const currentPathForMap = chainAttempt.currentAttempt?.path || [];

    return {
      avatarPosition,
      bearing,
      simulatableRoute: planner.simulatableRoute,
      currentPath: currentPathForMap,
      onMapLoad: handleMapLoad,
      onThreeLayerReady: handleThreeLayerReady,
      routeWaypoints: planner.routeWaypoints,
      nodes: allNodesForMap,
      territory,
      spheres,
      isDrawingMode: activityState === 'planning_start' || activityState === 'planning_end',
      onMapClick: handleMapClick,
    };
  }, [
    avatarPosition,
    bearing,
    handleMapLoad,
    handleThreeLayerReady,
    planner.simulatableRoute,
    planner.routeWaypoints,
    chainAttempt.currentAttempt,
    nodes,
    territory,
    spheres,
    activityState,
    handleMapClick
  ]);

  const trackingControlsProps = useMemo(() => ({
    activityState,
    trackingState: chainAttempt.currentAttempt 
      ? (activityState === 'tracking_paused' ? 'paused' : 'recording')
      : 'idle' as any,
    onStart: handleStart,
    onPause: handlePause,
    onResume: handleResume,
    onStop: handleStop,
    isSimulationMode: simulation.isSimulationMode,
    onClearTestData: () => simulation.clearTestData(setNodes, setChains),
  }), [
    activityState, 
    chainAttempt.currentAttempt, 
    handleStart, 
    handlePause, 
    handleResume, 
    handleStop,
    simulation
  ]);

  const rightSidebarProps = useMemo(() => ({ 
    onMyLocationClick: handleMyLocationClick,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onLayers: () => openOverlay('layers'),
  }), [handleMyLocationClick, zoomIn, zoomOut, openOverlay]);
  
  const leftSidebarProps = useMemo(() => ({
    onProfileClick: () => openOverlay('profile'),
    onHistoryClick: () => openOverlay('history'),
    geolocationState: geolocationState,
    onMyLocationClick: handleMyLocationClick,
    isSimulating: simulation.isSimulationMode,
    onSimulateClick: handleSimulateClick,
  }), [
    openOverlay,
    geolocationState, 
    handleMyLocationClick, 
    simulation.isSimulationMode, 
    handleSimulateClick
  ]);

  // === UI ===
  return (
    <div className="w-screen h-screen relative">
      <Map {...mapProps} />
      <LeftSidebar {...leftSidebarProps} />
      <TrackingControls {...trackingControlsProps} />
      <RightSidebar {...rightSidebarProps} />

      {/* Simulation mode indicator */}
      {simulation.isSimulationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-20">
          <Lock size={16} />
          <span>🧪 TEST MODE: Данные не сохраняются</span>
        </div>
      )}

      {activityState === 'simulating' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-20">
          <Lock size={14} />
          <span>Симуляция движения активна</span>
        </div>
      )}
      
      {chainAttempt.currentAttempt && !simulation.isSimulationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-20">
          Поход активен: {chainAttempt.currentAttempt.path.length} точек
        </div>
      )}
      
      {territory && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-20">
          Территория: {nodes.filter(n => n.status === 'established').length} узлов
          {territory.properties?.isTemporary && (
            <span className="ml-2 text-yellow-300">🧪</span>
          )}
        </div>
      )}

      <NotificationContainer />

      <ZoomIndicator />

      <ProfileOverlay isOpen={activeOverlay === 'profile'} onClose={closeOverlay} />
      <HistoryOverlay isOpen={activeOverlay === 'history'} onClose={closeOverlay} />
      
      {/* Layers Overlay (Mini version, no backdrop) */}
      <LayersOverlay isOpen={activeOverlay === 'layers'} onClose={closeOverlay} />
    </div>
  );
}

export default App;