// src/App.tsx
import { useCallback, useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Lock } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- Imports ---
import { AuthProvider } from './contexts/AuthContext';
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
import { useSphereEffects } from './hooks/useSphereEffects';
import { useMapEffects } from './hooks/useMapEffects';
import { useSyncTerritory } from './hooks/useSyncTerritory';
import { useSyncNodes } from './hooks/useSyncNodes';
import { useSyncChains } from './hooks/useSyncChains';
import { useMultiplayerTerritories } from './hooks/useMultiplayerTerritories';
import { ThreeLayer } from './utils/ThreeLayer';
import { useAuth } from './hooks/useAuth';

// NEW: Simulation mode
import { useSimulationMode } from './simulation/useSimulationMode';

// NEW: Utils (game rules now used in handlers)

// NEW: Feature Hooks
import { useNodes } from '@features/nodes';
import { useChains } from '@features/chains';
import { useTerritory } from '@features/territory';

// NEW: Handlers
import { useNodeCreationHandler } from './components/handlers/NodeCreationHandler';
import { useTrackingHandler } from './components/handlers/useTrackingHandler';
import { useMapControlsHandler } from './components/handlers/useMapControlsHandler';

import { Map } from './components/Map';
import { TrackingControls } from './components/TrackingControls';
import { RightSidebar } from './ui/RightSidebar';
import { LeftSidebar } from './ui/LeftSideBar';

// NEW: Notification System & Overlays
import { NotificationContainer } from './ui/notifications/NotificationContainer';

// NEW: Tutorial System
import { useTutorial } from './features/tutorial/useTutorial';
import { TutorialOverlay } from './features/tutorial/TutorialOverlay';
import { tutorialSteps } from './features/tutorial/tutorialSteps';

// Lazy load оверлеев (загружаются только при открытии)
const ProfileOverlay = lazy(() => import('./ui/overlays/ProfileOverlay').then(m => ({ default: m.ProfileOverlay })));
const HistoryOverlay = lazy(() => import('./ui/overlays/HistoryOverlay').then(m => ({ default: m.HistoryOverlay })));
const LayersOverlay = lazy(() => import('./ui/overlays/LayersOverlay').then(m => ({ default: m.LayersOverlay })));

// --- Types ---
import type { ActivityState, TrackingState } from './types';

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

  // Auth context for user ID
  const { user, isLoading: isAuthLoading } = useAuth();

  // Check if user is developer (from environment variable)
  const isDeveloper = useMemo(() => {
    const devEmails = import.meta.env.VITE_DEV_EMAILS
      .split(",")
      .map((e: string) => e.trim());
    return devEmails.includes(user?.email ?? "");
  }, [user?.email]);

  // Sync territory to Supabase
  useSyncTerritory({
    territoryKm2: playerStats.territoryKm2,
    enabled: !simulation.isSimulationMode, // Don't sync in simulation mode
  });

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



  // === Feature Hooks (replace old useState + useEffect) ===
  const nodesHook = useNodes({
    isSimulationMode: simulation.isSimulationMode,
    onLoadComplete: async () => {
      // ✅ Миграция из localStorage в IndexedDB (if needed)
      const { migrateToIndexedDB } = await import('@shared/storage/migration');
      await migrateToIndexedDB();
      log('Data load complete');
    }
  });

  const chainsHook = useChains({
    isSimulationMode: simulation.isSimulationMode,
  });

  const { nodes } = nodesHook;
  const { chains } = chainsHook;

  // ✅ Territory calculation (auto-updates when nodes change)
  const territory = useTerritory(nodes);

  // Sync nodes and chains to Supabase (after nodes/chains are defined)
  useSyncNodes(
    user?.id || null,
    nodes,
    simulation.isSimulationMode
  );

  useSyncChains(
    user?.id || null,
    chains,
    simulation.isSimulationMode
  );

  // Fetch other players' territories for multiplayer display
  const multiplayer = useMultiplayerTerritories(
    user?.id || null,
    territory,
    !simulation.isSimulationMode // Enabled only in normal mode
  );

  // ✅ Node creation handler
  const nodeCreation = useNodeCreationHandler({
    nodesHook,
    chainsHook,
    isSimulationMode: simulation.isSimulationMode,
    onSuccess: showSuccess,
    onWarning: showWarning,
  });

  // === Local State ===
  const [activityState, setActivityState] = useState<ActivityState>('idle');
  const [findMePulse, setFindMePulse] = useState(false);

  // Callback to trigger Find Me pulse animation
  const triggerFindMePulse = useCallback(() => {
    setFindMePulse(true);
    setTimeout(() => setFindMePulse(false), 2500); // 3 pulses × 0.8s = 2.4s
  }, []);

  // ✅ Tracking handler (needs activityState, so defined after local state)
  const tracking = useTrackingHandler({
    nodesHook,
    chainsHook,
    isSimulationMode: simulation.isSimulationMode,
    activityState,
    avatarPosition: avatarPosition as [number, number] | null,
    chainAttempt,
    playerStats,
    simulator,
    planner,
    setActivityState,
    setAvatarPosition,
    setBearing,
    flyToAvatar,
    onSuccess: showSuccess,
    onInfo: showInfo,
    onError: showError,
    onWarning: showWarning,
    onFindMePulse: triggerFindMePulse,
    log,
  });

  // ✅ Map controls handler
  const mapControls = useMapControlsHandler({
    activityState,
    simulation,
    planner,
    nodes,
    chains,
    locateUser,
    setAvatarPosition,
    setActivityState,
    flyToAvatar,
    onSuccess: showSuccess,
    onInfo: showInfo,
    onError: showError,
    log,
  });

  const [isFollowingAvatar, setIsFollowingAvatar] = useState(false);
  const [isThreeLayerReady, setIsThreeLayerReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // ✅ App ready state - all critical resources loaded
  const isAppReady = !isAuthLoading && isThreeLayerReady && !nodesHook.isLoading;

  // Tutorial system (only show after app is ready)
  const tutorial = useTutorial(tutorialSteps, { isAppReady });

  // Hide loader with fade-out transition when app is ready
  useEffect(() => {
    if (isAppReady && showLoader) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setShowLoader(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isAppReady, showLoader]);

  // ✅ Sphere effects (generation + animation)
  const spheres = useSphereEffects({ chains, nodes, map });

  // ✅ Map effects (load, three layer sync, cursor)
  const mapEffects = useMapEffects({
    map,
    setMap,
    threeLayerRef,
    isThreeLayerReady,
    setIsThreeLayerReady,
    chains,
    nodes,
    spheres,
    activityState,
    nodesHook,
    chainsHook,
    log,
  });

  // Anti-cheat handler
  const handleCheatDetected = useCallback(() => {
    log('Cheat detected - stopping chain attempt');
    showError('Too fast!');
    chainAttempt.clearAttempt();
    setActivityState('idle');
  }, [chainAttempt, log, showError]);

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

  // === MAP EVENT HANDLERS ===
  // ✅ Extracted to useMapEffects
  const handleMapLoad = mapEffects.handleMapLoad;
  const handleThreeLayerReady = mapEffects.handleThreeLayerReady;

  // === 3D LAYER EFFECTS ===
  // ✅ Chains sync, spheres sync, cursor - extracted to useMapEffects

  // === CAMERA FOLLOW DURING SIMULATION ===
  useEffect(() => {
    if (!isFollowingAvatar || activityState !== 'simulating' || !map || !avatarPosition) return;

    const normalizedBearing = (bearing + 360) % 360;

    // Плавный поворот карты вместе с направлением движения
    map.easeTo({
      center: avatarPosition as [number, number],
      bearing: normalizedBearing, // Карта поворачивается по направлению движения
      pitch: 60, // 3D вид сверху-сбоку
      zoom: 17,
      duration: 200, // Быстрее для плавности
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

  // ✅ Disable/Enable map interactions during simulation
  useEffect(() => {
    if (!map) return;

    if (activityState === 'simulating') {
      // Блокируем управление картой во время симуляции
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    } else {
      // Разблокируем после симуляции
      map.dragPan.enable();
      map.scrollZoom.enable();
      map.boxZoom.enable();
      map.dragRotate.enable();
      map.keyboard.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    }

    return () => {
      // Cleanup: всегда разблокируем
      if (map) {
        map.dragPan.enable();
        map.scrollZoom.enable();
        map.boxZoom.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
      }
    };
  }, [map, activityState]);

  // === TERRITORY CALCULATION ===
  // ✅ Territory is now calculated automatically by useTerritory hook

  // === SPHERE GENERATION & ANIMATION ===
  // ✅ Extracted to useSphereEffects hook

  // === EVENT HANDLERS ===

  // ✅ Map controls extracted to useMapControlsHandler
  const handleMyLocationClick = mapControls.handleMyLocationClick;

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

        nodeCreation.createChainFromSimulation(
          startCoords,
          endCoords,
          planner.simulatableRoute
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
    const endCoords = avatarPosition as [number, number];

    // Reduce path to only 2 points [start, end] for storage
    const reducedPath = path.length === 2
      ? path
      : [path[0], path[path.length - 1]];

    log('Chain path reduced', {
      originalLength: path.length,
      reducedLength: reducedPath.length
    });

    // Finish chain creation with validation
    const result = nodeCreation.finishChainCreation(nodeA, endCoords, reducedPath);

    if (!result.success) {
      chainAttempt.clearAttempt();
      setActivityState('idle');
      return;
    }

    // Clear attempt
    chainAttempt.clearAttempt();
    setActivityState('idle');
    resetGeolocationState();

    // Update player stats (only in real mode)
    if (!simulation.isSimulationMode) {
      playerStats.incrementChainsCreated();
    }

    log('Chain created successfully', {
      chainId: result.chain?.id,
      pathLength: path.length,
      nodeA: result.nodeA?.id,
      nodeB: result.nodeB?.id,
      isTemporary: simulation.isSimulationMode
    });

  }, [
    chainAttempt,
    avatarPosition,
    activityState,
    simulator,
    planner,
    resetGeolocationState,
    playerStats,
    simulation.isSimulationMode,
    log,
    nodeCreation,
    setActivityState
  ]);

  // ✅ Tracking handlers extracted to useTrackingHandler
  const handleStart = tracking.handleStart;
  const handlePause = tracking.handlePause;
  const handleResume = tracking.handleResume;

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
      showInfo('Simulation OFF');
      return;
    }

    // Block if real walk is active
    if (chainAttempt.currentAttempt) {
      showError('Finish journey first');
      return;
    }

    // Enter simulation mode and start planning
    log('Entering simulation mode');
    simulation.enterSimulationMode();
    planner.resetPlanner();
    setActivityState('planning_start');
    showInfo('Simulation ON');

  }, [
    simulation,
    activityState,
    chainAttempt,
    simulator,
    planner,
    resetGeolocationState,
    log,
    showError,
    showInfo
  ]);

  const handleMapClick = mapControls.handleMapClick;

  // === PROPS ===
  const mapProps = useMemo(() => {
    // 🔍 DEBUG: Log mapProps recalculation
    console.log('[App.tsx] mapProps recalculating', {
      simulatableRoutePoints: planner.simulatableRoute?.length || 0,
      routeWaypointsCount: planner.routeWaypoints?.length || 0,
      hasTerritory: !!territory,
    });

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
      threeLayerRef,
      // Multiplayer territories
      otherTerritories: Array.from(multiplayer.territories.values()),
      territoryConflicts: multiplayer.conflicts,
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
    handleMapClick,
    threeLayerRef,
    multiplayer.territories,
    multiplayer.conflicts,
  ]);

  const { mapStyleTheme } = useUIStore();

  const trackingControlsProps = useMemo(() => ({
    activityState,
    trackingState: chainAttempt.currentAttempt
      ? (activityState === 'tracking_paused' ? 'paused' : 'recording')
      : 'idle' as TrackingState,
    onStart: handleStart,
    onPause: handlePause,
    onResume: handleResume,
    onStop: handleStop,
    isSimulationMode: simulation.isSimulationMode,
    onClearTestData: () => {
      // Clear temporary test data using hooks
      const allNodes = nodesHook.nodes;
      const allChains = chainsHook.chains;

      const temporaryNodes = allNodes.filter(n => n.isTemporary);
      const temporaryChains = allChains.filter(c => c.isTemporary);

      temporaryNodes.forEach(n => nodesHook.removeNode(n.id));
      temporaryChains.forEach(c => chainsHook.removeChain(c.id));

      console.log(`[SIMULATION] 🗑️ Cleared ${temporaryNodes.length} temporary nodes and ${temporaryChains.length} temporary chains`);
    },
    mapStyleTheme,
  }), [
    activityState,
    chainAttempt.currentAttempt,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    simulation,
    nodesHook,
    chainsHook,
    mapStyleTheme
  ]);

  const rightSidebarProps = useMemo(() => ({
    onMyLocationClick: handleMyLocationClick,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onLayers: () => openOverlay('layers'),
    mapStyleTheme,
  }), [handleMyLocationClick, zoomIn, zoomOut, openOverlay, mapStyleTheme]);

  const leftSidebarProps = useMemo(() => ({
    onProfileClick: () => openOverlay('profile'),
    onHistoryClick: () => openOverlay('history'),
    geolocationState: geolocationState,
    onMyLocationClick: handleMyLocationClick,
    isSimulating: simulation.isSimulationMode,
    onSimulateClick: handleSimulateClick,
    isDeveloper,
    mapStyleTheme,
    findMePulse,
  }), [
    openOverlay,
    geolocationState,
    handleMyLocationClick,
    simulation.isSimulationMode,
    handleSimulateClick,
    isDeveloper,
    mapStyleTheme,
    findMePulse
  ]);

  // === UI ===
  return (
    <div className="app-container">
      <Map {...mapProps} />

      <LeftSidebar {...leftSidebarProps} />
      <TrackingControls {...trackingControlsProps} />
      <RightSidebar {...rightSidebarProps} />

      {/* Simulation mode indicator */}
      {simulation.isSimulationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-20">
          <Lock size={16} />
          <span>🧪 TEST MODE: Data not saved</span>
        </div>
      )}

      {activityState === 'simulating' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-20">
          <Lock size={14} />
          <span>Simulation active</span>
        </div>
      )}

      {chainAttempt.currentAttempt && !simulation.isSimulationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-20">
          Journey active: {chainAttempt.currentAttempt.path.length} pts
        </div>
      )}

      {territory && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-20">
          Territory: {nodes.filter(n => n.status === 'established').length} nodes
          {territory.properties?.isTemporary && (
            <span className="ml-2 text-yellow-300">🧪</span>
          )}
        </div>
      )}

      <NotificationContainer />

      {/* Tutorial overlay */}
      {tutorial.isActive && tutorial.currentStepData && (
        <TutorialOverlay
          step={tutorial.currentStepData}
          currentStep={tutorial.currentStep}
          totalSteps={tutorial.totalSteps}
          onNext={tutorial.nextStep}
          onSkip={tutorial.skipTutorial}
          onPrev={tutorial.prevStep}
        />
      )}

      {/* Lazy loaded оверлеи */}
      <Suspense fallback={null}>
        {activeOverlay === 'profile' && <ProfileOverlay isOpen={true} onClose={closeOverlay} />}
        {activeOverlay === 'history' && <HistoryOverlay isOpen={true} onClose={closeOverlay} />}
        {activeOverlay === 'layers' && <LayersOverlay isOpen={true} onClose={closeOverlay} />}
      </Suspense>

      {/* Loading Overlay */}
      {showLoader && (
        <div className={`loading-overlay ${isAppReady ? 'fade-out' : ''}`}>
          <div className="loader" />
          <span className="loading-text">Loading...</span>
        </div>
      )}
    </div>
  );
}

// Wrap App with AuthProvider
function AppWithProviders() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithProviders;