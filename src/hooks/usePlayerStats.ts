import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useAuth } from './useAuth';

interface PlayerStats {
  [x: string]: any;
  chainsCreatedToday: number;
  totalChains: number;
  territoryKm2: number;
  totalDistanceKm: number;
}

interface PlayerStatsDB {
  user_id: string;
  chains_created_today: number;
  last_chain_date: string | null;
  total_chains: number;
  total_nodes: number;
  total_distance_km: number;
  current_territory_km2: number;
  max_territory_km2: number;
  longest_chain_km: number;
  rank: number | null;
  score: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_STATS: PlayerStats = {
  chainsCreatedToday: 0,
  totalChains: 0,
  territoryKm2: 0,
  totalDistanceKm: 0,
};

export function usePlayerStats(): PlayerStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);

  useEffect(() => {
    // Always load local stats
    const localChains = JSON.parse(
      localStorage.getItem('qdam_chains') || '[]'
    );
    
    if (!user || !isSupabaseEnabled() || !supabase) {
      setStats({
        chainsCreatedToday: 0,
        totalChains: localChains.length,
        territoryKm2: 0,
        totalDistanceKm: 0,
      });
      return;
    }

    // Store supabase in a local variable for type narrowing
    const supabaseClient = supabase;

    // Загрузить stats из Supabase
    const loadStats = async () => {
      const { data, error } = await supabaseClient
        .from('player_stats')
        .select<'*', PlayerStatsDB>('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data) {
        setStats({
          chainsCreatedToday: data.chains_created_today,
          totalChains: data.total_chains,
          territoryKm2: data.current_territory_km2,
          totalDistanceKm: data.total_distance_km,
        });
      }
    };

    loadStats();

    // Подписаться на изменения stats в реальном времени
    const channel = supabaseClient
      .channel('player_stats_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_stats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as PlayerStatsDB;
          setStats({
            chainsCreatedToday: newData.chains_created_today,
            totalChains: newData.total_chains,
            territoryKm2: newData.current_territory_km2,
            totalDistanceKm: newData.total_distance_km,
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return stats;
}