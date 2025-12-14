/**
 * useSyncNodes - Auto-sync nodes to Supabase
 * 
 * Watches local nodes and syncs to server with debounce
 * Skip syncing in simulation mode
 */

import { useEffect, useRef } from 'react';
import { NodesService } from '../services/NodesService';
import type { Node } from '../types';

const SYNC_DEBOUNCE_MS = 2000; // 2 seconds for faster multiplayer updates

export function useSyncNodes(
  userId: string | null,
  nodes: Node[],
  isSimulationMode: boolean = false
) {
  const timeoutRef = useRef<number | null>(null);
  const lastSyncedCountRef = useRef(0);

  useEffect(() => {
    // Don't sync if:
    // - User not authenticated
    // - In simulation mode
    // - No new nodes since last sync
    if (!userId || isSimulationMode) return;

    const establishedCount = nodes.filter(
      (n) => n.status === 'established' && !n.isTemporary
    ).length;

    if (establishedCount === 0 || establishedCount === lastSyncedCountRef.current) {
      return;
    }

    console.log('[useSyncNodes] Scheduling sync for', establishedCount, 'nodes');

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce: wait 2s after last change
    timeoutRef.current = setTimeout(async () => {
      console.log('[useSyncNodes] Starting sync...');
      
      const result = await NodesService.syncNodes(userId, nodes);
      
      if (result.success) {
        lastSyncedCountRef.current = establishedCount;
        console.log('[useSyncNodes] Synced', result.synced, 'new nodes');
      } else {
        console.error('[useSyncNodes] Sync failed:', result.error);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userId, nodes, isSimulationMode]);
}
