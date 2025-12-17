import { useState, useCallback } from 'react';
import type { Node, Chain } from '../types';

/**
 * Хук для управления режимом симуляции (тестирования)
 * 
 * Режим симуляции позволяет разработчику тестировать все игровые функции
 * без реального GPS-трекинга и сохранения данных в localStorage.
 * 
 * Ключевые отличия:
 * - Не сохраняет данные в localStorage
 * - Не проверяет дневные лимиты
 * - Проверяет сферы влияния только временных узлов
 * - Данные исчезают после refresh
 */
export const useSimulationMode = () => {
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  /**
   * Включить режим симуляции
   */
  const enterSimulationMode = useCallback(() => {
    console.log('[SIMULATION] 🧪 Entering TEST MODE');
    setIsSimulationMode(true);
  }, []);

  /**
   * Выключить режим симуляции
   */
  const exitSimulationMode = useCallback(() => {
    console.log('[SIMULATION] ✅ Exiting TEST MODE');
    setIsSimulationMode(false);
  }, []);

  /**
   * Переключить режим симуляции
   */
  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => {
      console.log(`[SIMULATION] ${!prev ? '🧪 Entering' : '✅ Exiting'} TEST MODE`);
      return !prev;
    });
  }, []);

  /**
   * Очистить все тестовые данные (узлы и цепочки с флагом isTemporary)
   */
  const clearTestData = useCallback((
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    setChains: React.Dispatch<React.SetStateAction<Chain[]>>
  ) => {
    console.log('[SIMULATION] 🗑️ Clearing all temporary test data');

    setNodes(prev => {
      const permanentNodes = prev.filter(n => !n.isTemporary);
      console.log(`[SIMULATION] Removed ${prev.length - permanentNodes.length} temporary nodes`);
      return permanentNodes;
    });

    setChains(prev => {
      const permanentChains = prev.filter(c => !c.isTemporary);
      console.log(`[SIMULATION] Removed ${prev.length - permanentChains.length} temporary chains`);
      return permanentChains;
    });
  }, []);

  return {
    isSimulationMode,
    enterSimulationMode,
    exitSimulationMode,
    toggleSimulationMode,
    clearTestData,
  };
};

export type UseSimulationModeReturn = ReturnType<typeof useSimulationMode>;