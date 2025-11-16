/**
 * NodesService - Sync nodes (GPS points) with Supabase
 * 
 * Handles:
 * - Upload local nodes to server
 * - Download nodes from server
 * - Merge conflicts (local vs server)
 * - Privacy: only permanent nodes are synced
 */

import { supabase } from '../lib/supabase';
import type { Database, Json } from '../types/supabase';
import type { Node } from '../types';

type NodeRow = Database['public']['Tables']['nodes']['Row'];
type NodeInsert = Database['public']['Tables']['nodes']['Insert'];

export class NodesService {
  /**
   * Sync local nodes to Supabase
   * Only syncs established (permanent) nodes
   */
  static async syncNodes(
    userId: string,
    localNodes: Node[]
  ): Promise<{ success: boolean; synced: number; error?: string }> {
    if (!supabase) {
      return { success: false, synced: 0, error: 'Supabase not enabled' };
    }

    try {
      // Filter: only established nodes (not temporary)
      const nodesToSync = localNodes.filter(
        (node) => node.status === 'established' && !node.isTemporary
      );

      if (nodesToSync.length === 0) {
        console.log('[NodesService] No nodes to sync');
        return { success: true, synced: 0 };
      }

      console.log('[NodesService] Syncing', nodesToSync.length, 'nodes');

      // Get existing nodes from server
      const { data: existingNodes } = await supabase
        .from('nodes')
        .select('id')
        .eq('user_id', userId);

      const existingIds = new Set(
        (existingNodes || []).map((n: { id: string }) => n.id)
      );

      // Separate new nodes from existing
      const newNodes = nodesToSync.filter((node) => !existingIds.has(node.id));

      if (newNodes.length === 0) {
        console.log('[NodesService] All nodes already synced');
        return { success: true, synced: 0 };
      }

      // Prepare data for insert
      const nodesToInsert: NodeInsert[] = newNodes.map((node) => ({
        id: node.id,
        user_id: userId,
        coordinates: node.coordinates as unknown as Json,
        is_temporary: false,
        created_at: new Date(node.createdAt || Date.now()).toISOString(),
      }));

      // Batch insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('nodes')
        .insert(nodesToInsert);

      if (error) throw error;

      console.log('[NodesService] Successfully synced', newNodes.length, 'nodes');
      return { success: true, synced: newNodes.length };
    } catch (error: any) {
      console.error('[NodesService] Sync failed:', error);
      return { success: false, synced: 0, error: error.message || 'Sync failed' };
    }
  }

  /**
   * Fetch nodes from Supabase for current user
   */
  static async fetchMyNodes(userId: string): Promise<Node[]> {
    if (!supabase) {
      console.warn('[NodesService] Supabase not enabled');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('[NodesService] Fetched', data?.length || 0, 'nodes from server');

      // Convert to local Node format
      return (data || []).map((row: NodeRow) => ({
        id: row.id,
        coordinates: row.coordinates as [number, number],
        status: 'established' as const,
        isTemporary: false,
        createdAt: new Date(row.created_at).getTime(),
      }));
    } catch (error) {
      console.error('[NodesService] Fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch all nodes (for displaying other players' territories)
   * Returns nodes from all users
   */
  static async fetchAllNodes(): Promise<Map<string, Node[]>> {
    if (!supabase) {
      console.warn('[NodesService] Supabase not enabled');
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('[NodesService] Fetched', data?.length || 0, 'nodes from all users');

      // Group by user_id
      const nodesByUser = new Map<string, Node[]>();

      (data || []).forEach((row: NodeRow) => {
        const userId = row.user_id;
        const node: Node = {
          id: row.id,
          coordinates: row.coordinates as [number, number],
          status: 'established',
          isTemporary: false,
          createdAt: new Date(row.created_at).getTime(),
        };

        if (!nodesByUser.has(userId)) {
          nodesByUser.set(userId, []);
        }
        nodesByUser.get(userId)!.push(node);
      });

      return nodesByUser;
    } catch (error) {
      console.error('[NodesService] Fetch all failed:', error);
      return new Map();
    }
  }

  /**
   * Merge local and server nodes
   * Strategy: server always wins (for simplicity)
   */
  static mergeNodes(localNodes: Node[], serverNodes: Node[]): Node[] {
    const merged = new Map<string, Node>();

    // Add local nodes first
    localNodes.forEach((node) => {
      merged.set(node.id, node);
    });

    // Server nodes overwrite local (server wins)
    serverNodes.forEach((node) => {
      merged.set(node.id, node);
    });

    return Array.from(merged.values());
  }
}
