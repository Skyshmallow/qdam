// src/components/handlers/NodeCreationHandler.tsx
import { useCallback } from 'react';
import type { UseNodesReturn } from '@features/nodes';
import type { UseChainsReturn } from '@features/chains';
import { createChainFromPath } from '@utils/chainFactory';
import { isValidPath } from '@utils/gameRules';

interface NodeCreationHandlerProps {
  nodesHook: UseNodesReturn;
  chainsHook: UseChainsReturn;
  isSimulationMode: boolean;
  onSuccess: (message: string) => void;
  onWarning: (message: string) => void;
}

/**
 * Обработчик создания узлов и цепей
 * Извлечен из App.tsx для уменьшения размера компонента
 */
export const useNodeCreationHandler = ({
  nodesHook,
  chainsHook,
  isSimulationMode,
  onSuccess,
  onWarning,
}: NodeCreationHandlerProps) => {
  
  /**
   * Создать цепь из пути (для симуляции или реального трекинга)
   */
  const createChainFromSimulation = useCallback((
    startCoords: [number, number],
    endCoords: [number, number],
    path: number[][],
  ) => {
    const { nodeA, nodeB, chain } = createChainFromPath(
      startCoords,
      endCoords,
      path,
      isSimulationMode
    );
    
    nodesHook.addNode(nodeA);
    nodesHook.addNode(nodeB);
    chainsHook.addChain(chain);
    
    onSuccess(
      isSimulationMode
        ? 'Симуляция завершена! Замки созданы (временные).'
        : 'Симуляция завершена! Замки созданы.'
    );
  }, [nodesHook, chainsHook, isSimulationMode, onSuccess]);

  /**
   * Завершить создание цепи из активной попытки
   */
  const finishChainCreation = useCallback((
    nodeA: any,
    endCoords: [number, number],
    path: number[][],
  ) => {
    // Validate path
    const pathValidation = isValidPath(path);
    if (!pathValidation.allowed) {
      onWarning(pathValidation.reason || 'Путь слишком короткий для создания цепочки');
      return { success: false };
    }

    const startCoords = nodeA.coordinates as [number, number];

    // Create chain (permanent in real mode, temporary in simulation mode)
    const { nodeA: finalNodeA, nodeB, chain: newChain } = createChainFromPath(
      startCoords,
      endCoords,
      path,
      isSimulationMode
    );
    
    // Update state
    nodesHook.removeNode(nodeA.id);
    nodesHook.addNode(finalNodeA);
    nodesHook.addNode(nodeB);
    chainsHook.addChain(newChain);

    onSuccess(
      isSimulationMode 
        ? 'Цепочка создана (тестовая, не сохранится)!' 
        : 'Цепочка успешно создана!'
    );

    return { 
      success: true, 
      chain: newChain,
      nodeA: finalNodeA,
      nodeB,
    };
  }, [nodesHook, chainsHook, isSimulationMode, onSuccess, onWarning]);

  return {
    createChainFromSimulation,
    finishChainCreation,
  };
};
