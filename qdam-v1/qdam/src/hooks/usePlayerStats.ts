import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'qdam_player_stats';
const MAX_CHAINS_PER_DAY = 2;

interface PlayerStats {
  chainsCreatedToday: number;
  lastChainDate: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Хук для управления статистикой игрока
 */
export const usePlayerStats = () => {
  const [stats, setStats] = useState<PlayerStats>({
    chainsCreatedToday: 0,
    lastChainDate: new Date().toISOString().split('T')[0],
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PlayerStats = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        
        // Reset counter if it's a new day
        if (parsed.lastChainDate !== today) {
          console.log('[usePlayerStats] New day detected, resetting counter');
          setStats({
            chainsCreatedToday: 0,
            lastChainDate: today,
          });
        } else {
          setStats(parsed);
          console.log('[usePlayerStats] Loaded stats', parsed);
        }
      }
    } catch (error) {
      console.error('[usePlayerStats] Failed to load stats', error);
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('[usePlayerStats] Failed to save stats', error);
    }
  }, [stats]);

  // Increment chains created counter
  const incrementChainsCreated = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    setStats(prev => {
      // If new day, reset counter
      if (prev.lastChainDate !== today) {
        console.log('[usePlayerStats] New day, resetting counter and incrementing');
        return {
          chainsCreatedToday: 1,
          lastChainDate: today,
        };
      }
      
      // Same day, just increment
      console.log('[usePlayerStats] Incrementing chains created today');
      return {
        ...prev,
        chainsCreatedToday: prev.chainsCreatedToday + 1,
      };
    });
  }, []);

  // Alias for backward compatibility
  const recordNewChain = incrementChainsCreated;

  // Check if player can create a new chain
  const canCreateChain = stats.chainsCreatedToday < MAX_CHAINS_PER_DAY;

  // Reset daily stats (for testing/admin purposes)
  const resetDailyStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setStats({
      chainsCreatedToday: 0,
      lastChainDate: today,
    });
    console.log('[usePlayerStats] Daily stats reset');
  }, []);

  return {
    chainsCreatedToday: stats.chainsCreatedToday,
    maxChainsPerDay: MAX_CHAINS_PER_DAY,
    canCreateChain,
    incrementChainsCreated, 
    recordNewChain,         
    resetDailyStats,
  };
};