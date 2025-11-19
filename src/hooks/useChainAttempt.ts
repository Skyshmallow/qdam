import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import type { Node } from '../types';

/**
 * Тип для незавершенной попытки создания цепочки
 */
interface ChainAttempt {
  nodeA: Node;
  path: number[][];
}

const STORAGE_KEY = 'qdam_chain_attempt';

/**
 * Хук для управления незавершенным походом (chain attempt)
 * Автоматически сохраняет и восстанавливает состояние из localStorage
 */
export const useChainAttempt = () => {
  const [currentAttempt, setCurrentAttempt] = useState<ChainAttempt | null>(null);

  // Функция логирования
  const log = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    if (data) {
      console.log(`[${timestamp}][useChainAttempt] ${message}`, data);
    } else {
      console.log(`[${timestamp}][useChainAttempt] ${message}`);
    }
  }, []);

  // 1. При инициализации хука, пытаемся загрузить данные из localStorage
  useEffect(() => {
    try {
      const savedAttempt = localStorage.getItem(STORAGE_KEY);
      if (savedAttempt) {
        const parsed = JSON.parse(savedAttempt);

        // Проверяем срок действия (3 дня)
        const expirationTime = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (parsed.nodeA && (now - parsed.nodeA.createdAt) < expirationTime) {
          setCurrentAttempt(parsed);
          log('Restored unfinished chain attempt from localStorage', {
            nodeA_id: parsed.nodeA.id,
            pathLength: parsed.path.length,
            age: Math.round((now - parsed.nodeA.createdAt) / 1000 / 60) + ' minutes'
          });
        } else {
          log('Found expired attempt in localStorage, removing');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('[useChainAttempt] Failed to load from localStorage', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [log]);

  // 2. Функция для начала новой попытки
  const startAttempt = useCallback((startCoords: [number, number]) => {
    const nodeA: Node = {
      id: nanoid(),
      coordinates: startCoords,
      createdAt: Date.now(),
      status: 'pending',
    };

    const newAttempt: ChainAttempt = {
      nodeA,
      path: [startCoords], // Начинаем путь с первой точки
    };

    setCurrentAttempt(newAttempt);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAttempt));
      log('Started new attempt', {
        nodeA_id: nodeA.id,
        coordinates: startCoords
      });
    } catch (error) {
      console.error('[useChainAttempt] Failed to save to localStorage', error);
    }
  }, [log]);

  // 3. Функция для добавления точки к пути
  const addPointToAttempt = useCallback((point: [number, number]) => {
    setCurrentAttempt(prev => {
      if (!prev) {
        console.warn('[useChainAttempt] Cannot add point - no active attempt');
        return null;
      }

      const updatedPath = [...prev.path, point];
      const updatedAttempt = { ...prev, path: updatedPath };

      try {
        // Сохраняем каждые 10 точек или каждую 100-ю для оптимизации
        if (updatedPath.length % 10 === 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAttempt));
        }
      } catch (error) {
        console.error('[useChainAttempt] Failed to save path update', error);
      }

      return updatedAttempt;
    });
  }, []);

  // 4. Функция для завершения/очистки попытки
  const clearAttempt = useCallback(() => {
    if (currentAttempt) {
      log('Clearing attempt', {
        nodeA_id: currentAttempt.nodeA.id,
        finalPathLength: currentAttempt.path.length
      });
    }

    setCurrentAttempt(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[useChainAttempt] Failed to remove from localStorage', error);
    }
  }, [currentAttempt, log]);

  // 5. Функция для получения информации о текущей попытке
  const getAttemptInfo = useCallback(() => {
    if (!currentAttempt) return null;

    const now = Date.now();
    const durationMs = now - currentAttempt.nodeA.createdAt;
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    return {
      nodeA_id: currentAttempt.nodeA.id,
      startCoords: currentAttempt.nodeA.coordinates,
      pathLength: currentAttempt.path.length,
      durationMinutes,
      isExpired: durationMs > (3 * 24 * 60 * 60 * 1000)
    };
  }, [currentAttempt]);

  return {
    currentAttempt,
    startAttempt,
    addPointToAttempt,
    clearAttempt,
    getAttemptInfo,
  };
};

export type UseChainAttemptReturn = ReturnType<typeof useChainAttempt>;