/**
 * TerritoriesService - Manage multiplayer territories
 * 
 * Handles:
 * - Fetch all players' territories
 * - Real-time updates via Supabase subscriptions
 * - Territory conflict detection
 * - Color assignment for players
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { Feature, Polygon } from 'geojson';
import type { RealtimeChannel } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface PlayerTerritory {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  territoryKm2: number;
  territory: Feature<Polygon> | null;
  color: string;
  nodes: Array<[number, number]>;
  chains: Array<{
    id: string;
    path: number[][];
  }>;
}

export interface TerritoryUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string;
  timestamp: number;
}

export class TerritoriesService {
  private static colorPalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Cyan
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Green
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B739', // Gold
    '#52B788', // Emerald
  ];

  private static userColorMap = new Map<string, string>();
  private static colorIndex = 0;

  /**
   * Assign consistent color to user
   */
  private static assignColor(userId: string): string {
    if (this.userColorMap.has(userId)) {
      return this.userColorMap.get(userId)!;
    }

    const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
    this.colorIndex++;
    this.userColorMap.set(userId, color);
    return color;
  }

  /**
   * Calculate territory polygon from nodes using convex hull
   * Simple implementation - can be improved with proper territorial algorithms
   */
  private static calculateTerritoryPolygon(
    nodes: Array<[number, number]>
  ): Feature<Polygon> | null {
    if (nodes.length < 3) return null;

    // Simple convex hull using gift wrapping algorithm
    const hull = this.convexHull(nodes);
    
    if (hull.length < 3) return null;

    // Close the polygon
    const coordinates = [...hull, hull[0]];

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    };
  }

  /**
   * Convex hull algorithm (gift wrapping)
   */
  private static convexHull(points: Array<[number, number]>): Array<[number, number]> {
    if (points.length < 3) return points;

    // Find leftmost point
    let leftmost = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i][0] < points[leftmost][0]) {
        leftmost = i;
      }
    }

    const hull: Array<[number, number]> = [];
    let p = leftmost;
    let q: number;

    do {
      hull.push(points[p]);
      q = (p + 1) % points.length;

      for (let i = 0; i < points.length; i++) {
        if (this.orientation(points[p], points[i], points[q]) === 2) {
          q = i;
        }
      }

      p = q;
    } while (p !== leftmost);

    return hull;
  }

  /**
   * Find orientation of ordered triplet (p, q, r)
   * Returns: 0 = colinear, 1 = clockwise, 2 = counterclockwise
   */
  private static orientation(
    p: [number, number],
    q: [number, number],
    r: [number, number]
  ): number {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  }

  /**
   * Fetch all territories for multiplayer display
   */
  static async fetchAllTerritories(
    currentUserId: string | null
  ): Promise<Map<string, PlayerTerritory>> {
    if (!supabase) {
      console.warn('[TerritoriesService] Supabase not enabled');
      return new Map();
    }

    try {
      // Fetch all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url, territory_area_km2');

      if (profilesError) throw profilesError;

      // Fetch all nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('nodes')
        .select('user_id, coordinates');

      if (nodesError) throw nodesError;

      // Fetch all chains (2-point paths only)
      const { data: chainsData, error: chainsError } = await supabase
        .from('chains')
        .select('id, user_id, path');

      if (chainsError) throw chainsError;

      // Group data by user
      const territories = new Map<string, PlayerTerritory>();

      (profiles || []).forEach((profile: UserProfile) => {
        const userId = profile.user_id;
        
        // Skip current user (rendered separately)
        if (userId === currentUserId) return;

        // Get user's nodes
        const userNodes = (nodesData || [])
          .filter((n: any) => n.user_id === userId)
          .map((n: any) => n.coordinates as [number, number]);

        // Get user's chains
        const userChains = (chainsData || [])
          .filter((c: any) => c.user_id === userId)
          .map((c: any) => ({
            id: c.id,
            path: (c.path || []) as number[][], // 2 points: [start, end]
          }));

        // Calculate territory polygon
        const territory = this.calculateTerritoryPolygon(userNodes);

        territories.set(userId, {
          userId,
          username: profile.username || 'Unknown',
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          territoryKm2: profile.territory_area_km2 || 0,
          territory,
          color: this.assignColor(userId),
          nodes: userNodes,
          chains: userChains,
        });
      });

      console.log('[TerritoriesService] Fetched', territories.size, 'player territories');
      return territories;
    } catch (error) {
      console.error('[TerritoriesService] Fetch failed:', error);
      return new Map();
    }
  }

  /**
   * Subscribe to territory updates (real-time)
   */
  static subscribeToUpdates(
    callback: (update: TerritoryUpdate) => void
  ): RealtimeChannel | null {
    if (!supabase) {
      console.warn('[TerritoriesService] Supabase not enabled');
      return null;
    }

    const channel = supabase
      .channel('territories-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
        },
        (payload) => {
          console.log('[TerritoriesService] Node update:', payload);
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            userId: (payload.new as any)?.user_id || (payload.old as any)?.user_id,
            timestamp: Date.now(),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chains',
        },
        (payload) => {
          console.log('[TerritoriesService] Chain update:', payload);
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            userId: (payload.new as any)?.user_id || (payload.old as any)?.user_id,
            timestamp: Date.now(),
          });
        }
      )
      .subscribe();

    console.log('[TerritoriesService] Subscribed to real-time updates');
    return channel;
  }

  /**
   * Unsubscribe from updates
   */
  static async unsubscribe(channel: RealtimeChannel | null): Promise<void> {
    if (channel && supabase) {
      await supabase.removeChannel(channel);
      console.log('[TerritoriesService] Unsubscribed from updates');
    }
  }

  /**
   * Detect conflicts between territories
   * Returns array of user IDs with overlapping territories
   */
  static detectConflicts(
    myTerritory: Feature<Polygon> | null,
    otherTerritories: Map<string, PlayerTerritory>
  ): string[] {
    if (!myTerritory) return [];

    const conflicts: string[] = [];

    otherTerritories.forEach((player, userId) => {
      if (!player.territory) return;

      // Simple bounding box overlap check
      // TODO: Implement proper polygon intersection with turf.js
      const myBounds = this.getBounds(myTerritory);
      const otherBounds = this.getBounds(player.territory);

      if (this.boundsOverlap(myBounds, otherBounds)) {
        conflicts.push(userId);
      }
    });

    return conflicts;
  }

  /**
   * Get bounding box of polygon
   */
  private static getBounds(polygon: Feature<Polygon>): {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  } {
    const coords = polygon.geometry.coordinates[0];
    let minLng = coords[0][0];
    let maxLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLat = coords[0][1];

    coords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * Check if two bounding boxes overlap
   */
  private static boundsOverlap(
    a: { minLng: number; maxLng: number; minLat: number; maxLat: number },
    b: { minLng: number; maxLng: number; minLat: number; maxLat: number }
  ): boolean {
    return (
      a.minLng <= b.maxLng &&
      a.maxLng >= b.minLng &&
      a.minLat <= b.maxLat &&
      a.maxLat >= b.minLat
    );
  }
}
