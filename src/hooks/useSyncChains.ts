/**
 * useSyncChains - Auto-sync chains to Supabase
 * 
 * Watches local chains and syncs to server with debounce
 * Skip syncing in simulation mode
 */

import { useEffect, useRef } from 'react';
import { ChainsService } from '../services/ChainsService';
import type { Chain } from '../types';

const SYNC_DEBOUNCE_MS = 2000; // 2 seconds for faster multiplayer updates

export function useSyncChains(
  userId: string | null,
  chains: Chain[],
  isSimulationMode: boolean = false
) {
  const timeoutRef = useRef<number | null>(null);
  const lastSyncedCountRef = useRef(0);

  useEffect(() => {
    // Don't sync if:
    // - User not authenticated
    // - In simulation mode
    // - No new chains since last sync
    if (!userId || isSimulationMode) return;

    const establishedCount = chains.filter((c) => !c.isTemporary).length;

    if (establishedCount === 0 || establishedCount === lastSyncedCountRef.current) {
      return;
    }

    console.log('[useSyncChains] Scheduling sync for', establishedCount, 'chains');

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: wait 2s after last change
    timeoutRef.current = setTimeout(async () => {
      console.log('[useSyncChains] Starting sync...');
      
      const result = await ChainsService.syncChains(userId, chains);
      
      if (result.success) {
        lastSyncedCountRef.current = establishedCount;
        console.log('[useSyncChains] Synced', result.synced, 'new chains');
      } else {
        console.error('[useSyncChains] Sync failed:', result.error);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userId, chains, isSimulationMode]);
}
