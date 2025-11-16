/**
 * ChainsService - Sync chains (routes) with Supabase
 * 
 * Handles:
 * - Upload local chains to server
 * - Download chains from server
 * - Merge conflicts (local vs server)
 * 
 * Note: Chains store only 2 points [start, end] for privacy
 */

import { supabase } from '../lib/supabase';
import type { Database, Json } from '../types/supabase';
import type { Chain } from '../types';

type ChainRow = Database['public']['Tables']['chains']['Row'];
type ChainInsert = Database['public']['Tables']['chains']['Insert'];

export class ChainsService {
  /**
   * Calculate distance in km from path coordinates (2 points: straight line)
   */
  private static calculateDistance(path: number[][]): number {
    if (path.length !== 2) return 0;

    const [lon1, lat1] = path[0];
    const [lon2, lat2] = path[1];

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Sync local chains to Supabase
   * Only syncs established (permanent) chains
   */
  static async syncChains(
    userId: string,
    localChains: Chain[]
  ): Promise<{ success: boolean; synced: number; error?: string }> {
    if (!supabase) {
      return { success: false, synced: 0, error: 'Supabase not enabled' };
    }

    try {
      // Filter: only established chains (not temporary)
      const chainsToSync = localChains.filter(
        (chain) => !chain.isTemporary
      );

      if (chainsToSync.length === 0) {
        console.log('[ChainsService] No chains to sync');
        return { success: true, synced: 0 };
      }

      console.log('[ChainsService] Syncing', chainsToSync.length, 'chains');

      // Get existing chains from server
      const { data: existingChains } = await supabase
        .from('chains')
        .select('id')
        .eq('user_id', userId);

      const existingIds = new Set(
        (existingChains || []).map((c: { id: string }) => c.id)
      );

      // Separate new chains from existing
      const newChains = chainsToSync.filter((chain) => !existingIds.has(chain.id));

      if (newChains.length === 0) {
        console.log('[ChainsService] All chains already synced');
        return { success: true, synced: 0 };
      }

      // Prepare data for insert
      const chainsToInsert: ChainInsert[] = newChains.map((chain) => {
        // Ensure path has exactly 2 points [start, end]
        const reducedPath = chain.path.length === 2 
          ? chain.path 
          : [chain.path[0], chain.path[chain.path.length - 1]];
        
        const distance = this.calculateDistance(reducedPath);

        return {
          id: chain.id,
          user_id: userId,
          node_a_id: chain.nodeA_id,
          node_b_id: chain.nodeB_id,
          path: reducedPath as unknown as Json, // Only 2 points: [start, end]
          distance_km: distance,
          is_temporary: false,
          created_at: new Date(chain.createdAt || Date.now()).toISOString(),
        };
      });

      // Batch insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('chains')
        .insert(chainsToInsert);

      if (error) throw error;

      console.log('[ChainsService] Successfully synced', newChains.length, 'chains');
      return { success: true, synced: newChains.length };
    } catch (error: any) {
      console.error('[ChainsService] Sync failed:', error);
      return { success: false, synced: 0, error: error.message || 'Sync failed' };
    }
  }

  /**
   * Fetch chains from Supabase for current user
   */
  static async fetchMyChains(userId: string): Promise<Chain[]> {
    if (!supabase) {
      console.warn('[ChainsService] Supabase not enabled');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('chains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('[ChainsService] Fetched', data?.length || 0, 'chains from server');

      // Convert to local Chain format
      return (data || []).map((row: ChainRow) => ({
        id: row.id,
        nodeA_id: row.node_a_id || '',
        nodeB_id: row.node_b_id || '',
        path: row.path as number[][],
        createdAt: new Date(row.created_at).getTime(),
        isTemporary: false,
      }));
    } catch (error) {
      console.error('[ChainsService] Fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch all chains (for displaying other players' territories)
   * Returns 2-point paths for territory calculation
   */
  static async fetchAllChains(): Promise<Map<string, Chain[]>> {
    if (!supabase) {
      console.warn('[ChainsService] Supabase not enabled');
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('chains')
        .select('id, user_id, node_a_id, node_b_id, path, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('[ChainsService] Fetched', data?.length || 0, 'chains from all users');

      // Group by user_id
      const chainsByUser = new Map<string, Chain[]>();

      (data || []).forEach((row: any) => {
        const userId = row.user_id;
        const chain: Chain = {
          id: row.id,
          nodeA_id: row.node_a_id || '',
          nodeB_id: row.node_b_id || '',
          path: (row.path || []) as number[][], // 2 points: [start, end]
          createdAt: new Date(row.created_at).getTime(),
          isTemporary: false,
        };

        if (!chainsByUser.has(userId)) {
          chainsByUser.set(userId, []);
        }
        chainsByUser.get(userId)!.push(chain);
      });

      return chainsByUser;
    } catch (error) {
      console.error('[ChainsService] Fetch all failed:', error);
      return new Map();
    }
  }

  /**
   * Merge local and server chains
   * Strategy: server always wins (for simplicity)
   */
  static mergeChains(localChains: Chain[], serverChains: Chain[]): Chain[] {
    const merged = new Map<string, Chain>();

    // Add local chains first
    localChains.forEach((chain) => {
      merged.set(chain.id, chain);
    });

    // Server chains overwrite local (server wins)
    serverChains.forEach((chain) => {
      merged.set(chain.id, chain);
    });

    return Array.from(merged.values());
  }
}
