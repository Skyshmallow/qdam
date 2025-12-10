// src/components/handlers/useTrackingHandler.ts
import { useCallback } from 'react';
import type { UseNodesReturn } from '@features/nodes';
import type { UseChainsReturn } from '@features/chains';
import { canCreateChainToday, canStartChain } from '@utils/gameRules';

import type { ActivityState } from '../../types';
import type { UseChainAttemptReturn } from '../../hooks/useChainAttempt';
import type { UsePlayerStatsReturn } from '../../hooks/usePlayerStats';
import type { UseSimulatorReturn } from '../../hooks/useSimulator';
import type { UseMapPlannerReturn } from '../../hooks/useMapPlanner';

interface TrackingHandlerProps {
  nodesHook: UseNodesReturn;
  chainsHook: UseChainsReturn;
  isSimulationMode: boolean;
  activityState: ActivityState;
  avatarPosition: [number, number] | null;
  chainAttempt: UseChainAttemptReturn;
  playerStats: UsePlayerStatsReturn;
  simulator: UseSimulatorReturn;
  planner: UseMapPlannerReturn;
  setActivityState: (state: ActivityState) => void;
  setAvatarPosition: (pos: [number, number]) => void;
  setBearing: (bearing: number) => void;
  flyToAvatar: () => void;
  onSuccess: (message: string) => void;
  onInfo: (message: string) => void;
  onError: (message: string) => void;
  onWarning: (message: string) => void;
  log: (step: string, details?: Record<string, unknown>) => void;
}

/**
 * Hook для управления трекингом походов
 * Извлечен из App.tsx для уменьшения размера компонента
 */
export const useTrackingHandler = ({
  nodesHook,
  chainsHook,
  isSimulationMode,
  activityState,
  avatarPosition,
  chainAttempt,
  playerStats,
  simulator,
  planner,
  setActivityState,
  setAvatarPosition,
  setBearing,
  flyToAvatar,
  onSuccess,
  onInfo,
  onError,
  onWarning,
  log,
}: TrackingHandlerProps) => {

  const { nodes } = nodesHook;
  const { chains } = chainsHook;

  /**
   * Начать симуляцию похода по маршруту
   */
  const handleStartSimulation = useCallback(() => {
    if (!planner.simulatableRoute) {
      log('Cannot start simulation - no route available');
      return;
    }
    log('Starting simulation', { routeLength: planner.simulatableRoute.length });
    setActivityState('simulating');

    simulator.startSimulation(
      planner.simulatableRoute,
      (newCoords: [number, number], newBearing: number) => {
        setAvatarPosition(newCoords);
        setBearing(newBearing);
      },
      () => {
        log('Simulation movement completed (auto-stop disabled)');
        // Don't auto-stop - let user click Stop to create castles
      }
    );
  }, [planner, simulator, setAvatarPosition, setBearing, setActivityState, log]);

  /**
   * Начать новый поход (реальный или симуляция)
   */
  const handleStart = useCallback(() => {
    log('handleStart called', {
      currentState: activityState,
      isSimulation: isSimulationMode
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
      onInfo('Find Me');
      return;
    }

    // Block if already has active attempt
    if (chainAttempt.currentAttempt) {
      const info = chainAttempt.getAttemptInfo();
      if (info) {
        log('Active attempt found', info);
        onWarning('Поход активен');
      } else {
        log('Active attempt found (no info available)');
        onWarning('Поход активен');
      }
      setActivityState('tracking');
      return;
    }

    // Check daily limit (skip in simulation mode)
    if (!canCreateChainToday(playerStats.chainsCreatedToday, isSimulationMode)) {
      onError('Лимит дня');
      return;
    }

    // Check sphere of influence
    const sphereCheck = canStartChain(
      avatarPosition as [number, number],
      nodes,
      chains,
      isSimulationMode
    );

    if (!sphereCheck.allowed) {
      log('Sphere check failed', { reason: sphereCheck.reason });
      onError('Вне зоны');
      return;
    }

    log('Starting new chain attempt');
    chainAttempt.startAttempt(avatarPosition as [number, number]);
    flyToAvatar();
    setActivityState('tracking');
    onSuccess(isSimulationMode ? 'Тест старт' : 'Поход начат');

  }, [
    activityState,
    avatarPosition,
    chainAttempt,
    chains,
    nodes,
    playerStats,
    isSimulationMode,
    flyToAvatar,
    handleStartSimulation,
    setActivityState,
    onSuccess,
    onInfo,
    onError,
    onWarning,
    log
  ]);

  /**
   * Приостановить поход
   */
  const handlePause = useCallback(() => {
    log('Pause clicked');
    setActivityState('tracking_paused');
    onInfo('Пауза');
  }, [setActivityState, onInfo, log]);

  /**
   * Возобновить поход
   */
  const handleResume = useCallback(() => {
    log('Resume clicked');
    setActivityState('tracking');
    onInfo('Продолжить');
  }, [setActivityState, onInfo, log]);

  return {
    handleStart,
    handlePause,
    handleResume,
    handleStartSimulation,
  };
};
