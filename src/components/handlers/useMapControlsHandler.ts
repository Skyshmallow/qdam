// src/components/handlers/useMapControlsHandler.ts
import { useCallback } from 'react';
import { canStartChain } from '@utils/gameRules';

interface MapControlsHandlerProps {
  activityState: string;
  simulation: any;
  planner: any;
  nodes: any[];
  chains: any[];
  locateUser: () => Promise<[number, number] | null>;
  setAvatarPosition: (pos: [number, number]) => void;
  setActivityState: (state: any) => void;
  flyToAvatar: () => void;
  onSuccess: (message: string) => void;
  onInfo: (message: string) => void;
  onError: (message: string) => void;
  log: (step: string, details?: Record<string, unknown>) => void;
}

/**
 * Hook для управления элементами управления картой
 * Извлечен из App.tsx для уменьшения размера компонента
 */
export const useMapControlsHandler = ({
  activityState,
  simulation,
  planner,
  nodes,
  chains,
  locateUser,
  setAvatarPosition,
  setActivityState,
  flyToAvatar,
  onSuccess,
  onInfo,
  onError,
  log,
}: MapControlsHandlerProps) => {
  
  /**
   * Обработчик клика "Моё местоположение"
   */
  const handleMyLocationClick = useCallback(async () => {
    const coords = await locateUser();
    if (coords) {
      setAvatarPosition(coords);
      flyToAvatar();
    }
  }, [locateUser, setAvatarPosition, flyToAvatar]);

  /**
   * Обработчик кликов по карте (для планирования маршрута)
   */
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
        onError(sphereCheck.reason || 'Cannot plan route outside sphere of influence');
        return;
      }

      await planner.addWaypoint(coordinates);
      setActivityState('planning_end');
      onInfo('Выберите конечную точку на карте');

    } else if (activityState === 'planning_end') {
      await planner.addWaypoint(coordinates);
      setActivityState('ready_to_simulate');
      onSuccess('Маршрут построен. Нажмите Play для запуска симуляции.');
    }
  }, [
    activityState, 
    planner, 
    chains, 
    nodes, 
    simulation.isSimulationMode, 
    setActivityState,
    onSuccess,
    onInfo,
    onError,
    log
  ]);

  return {
    handleMyLocationClick,
    handleMapClick,
  };
};
