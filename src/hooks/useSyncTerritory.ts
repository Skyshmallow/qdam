/**
 * useSyncTerritory - Auto-sync territory stats to Supabase
 * 
 * Watches local territory changes and syncs to server
 */

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { ProfileService } from '../services/ProfileService';

interface UseSyncTerritoryOptions {
  territoryKm2: number;
  enabled?: boolean;
  debounceMs?: number;
}

export function useSyncTerritory({
  territoryKm2,
  enabled = true,
  debounceMs = 5000 // 5 seconds debounce
}: UseSyncTerritoryOptions) {
  const { user, isAuthenticated } = useAuth();
  const lastSyncedValue = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't sync if not authenticated or disabled
    if (!isAuthenticated || !user?.id || !enabled) {
      return;
    }

    // Don't sync if value hasn't changed
    if (lastSyncedValue.current === territoryKm2) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: wait for territory to stabilize before syncing
    timeoutRef.current = setTimeout(async () => {
      console.log('[useSyncTerritory] Syncing territory:', territoryKm2, 'km²');

      const result = await ProfileService.updateTerritoryStats(user.id, territoryKm2);

      if (result.success) {
        lastSyncedValue.current = territoryKm2;
        console.log('[useSyncTerritory] Territory synced successfully');
      } else {
        console.error('[useSyncTerritory] Failed to sync:', result.error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [territoryKm2, isAuthenticated, user?.id, enabled, debounceMs]);
}
