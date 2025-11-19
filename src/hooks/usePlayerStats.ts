import { useState, useEffect } from 'react';

interface PlayerStats {
  chainsCreatedToday: number;
  totalChains: number;
  territoryKm2: number;
  totalDistanceKm: number;
  maxChainsPerDay: number;
  incrementChainsCreated: () => void;
}

export function usePlayerStats(): PlayerStats {
  const [stats, setStats] = useState({
    chainsCreatedToday: 0,
    totalChains: 0,
    territoryKm2: 0,
    totalDistanceKm: 0,
  });

  useEffect(() => {
    // Load from localStorage only
    const localChains = JSON.parse(
      localStorage.getItem('qdam_chains') || '[]'
    );

    setStats({
      chainsCreatedToday: 0,
      totalChains: localChains.length,
      territoryKm2: 0,
      totalDistanceKm: 0,
    });
  }, []);

  const incrementChainsCreated = () => {
    setStats(prev => ({
      ...prev,
      chainsCreatedToday: prev.chainsCreatedToday + 1,
      totalChains: prev.totalChains + 1,
    }));
  };

  return {
    ...stats,
    maxChainsPerDay: 3,
    incrementChainsCreated,
  };
}

export type UsePlayerStatsReturn = ReturnType<typeof usePlayerStats>;