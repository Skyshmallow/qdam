/**
 * useMultiplayerTerritories - Fetch and manage other players' territories
 * 
 * Features:
 * - Initial fetch of all territories
 * - Real-time updates via Supabase subscriptions
 * - Conflict detection
 * - Auto-refresh on updates
 */

import { useEffect, useState, useCallback } from 'react';
import { TerritoriesService, type PlayerTerritory, type TerritoryUpdate } from '../services/TerritoriesService';
import type { Feature, Polygon } from 'geojson';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useMultiplayerTerritories(
  currentUserId: string | null,
  myTerritory: Feature<Polygon> | null,
  enabled: boolean = true
) {
  const [territories, setTerritories] = useState<Map<string, PlayerTerritory>>(new Map());
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch all territories
  const fetchTerritories = useCallback(async () => {
    if (!enabled || !currentUserId) return;

    setIsLoading(true);
    console.log('[useMultiplayerTerritories] Fetching territories...');

    const territoriesMap = await TerritoriesService.fetchAllTerritories(currentUserId);
    setTerritories(territoriesMap);

    // Detect conflicts
    const conflictIds = TerritoriesService.detectConflicts(myTerritory, territoriesMap);
    setConflicts(conflictIds);

    setIsLoading(false);
    setLastUpdate(Date.now());
  }, [currentUserId, myTerritory, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchTerritories();
  }, [fetchTerritories]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !currentUserId) return;

    let channel: RealtimeChannel | null = null;
    let refreshTimeout: number | null = null;

    const handleUpdate = (update: TerritoryUpdate) => {
      console.log('[useMultiplayerTerritories] Update received:', update);

      // Debounce: refresh after 2 seconds of last update
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        console.log('[useMultiplayerTerritories] Refreshing territories...');
        fetchTerritories();
      }, 2000);
    };

    // Subscribe
    channel = TerritoriesService.subscribeToUpdates(handleUpdate);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      if (channel) {
        TerritoriesService.unsubscribe(channel);
      }
    };
  }, [enabled, currentUserId, fetchTerritories]);

  return {
    territories,
    conflicts,
    isLoading,
    lastUpdate,
    refresh: fetchTerritories,
  };
}
