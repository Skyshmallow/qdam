/**
 * ProfileService - CRUD operations for user profiles
 * 
 * Handles:
 * - Profile updates (name, nickname, avatar)
 * - Territory statistics sync
 * - Profile data fetching
 */

import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export class ProfileService {
  /**
   * Get user profile by user_id
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) {
      console.warn('[ProfileService] Supabase not enabled');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ProfileService] Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Update profile fields (display_name, username/nickname)
   */
  static async updateProfile(
    userId: string,
    updates: {
      display_name?: string;
      username?: string;
      avatar_url?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not enabled' };
    }

    try {
      // Validate username if provided
      if (updates.username) {
        const validationError = this.validateUsername(updates.username);
        if (validationError) {
          return { success: false, error: validationError };
        }

        // Check if username is already taken
        const { data: existing, error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('username', updates.username)
          .neq('user_id', userId)
          .maybeSingle();

        // Ignore "no rows" error - it means username is available
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn('[ProfileService] Username check error:', checkError);
        }

        if (existing) {
          return { success: false, error: 'Nickname already taken' };
        }
      }

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[ProfileService] Profile updated:', updates);
      return { success: true };
    } catch (error: unknown) {
      console.error('[ProfileService] Failed to update profile:', error);
      const message = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: message };
    }
  }

  /**
   * Update territory statistics
   */
  static async updateTerritoryStats(
    userId: string,
    territoryKm2: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not enabled' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ territory_area_km2: territoryKm2 })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[ProfileService] Territory stats updated:', territoryKm2, 'km²');
      return { success: true };
    } catch (error: unknown) {
      console.error('[ProfileService] Failed to update territory stats:', error);
      const message = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: message };
    }
  }

  /**
   * Update avatar URL
   */
  static async updateAvatar(
    userId: string,
    avatarUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not enabled' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('[ProfileService] Avatar updated');
      return { success: true };
    } catch (error: unknown) {
      console.error('[ProfileService] Failed to update avatar:', error);
      const message = error instanceof Error ? error.message : 'Update failed';
      return { success: false, error: message };
    }
  }

  /**
   * Validate username (nickname)
   * - 3-20 characters
   * - Alphanumeric + underscore only
   */
  private static validateUsername(username: string): string | null {
    if (!username || username.length < 3) {
      return 'Nickname must be at least 3 characters';
    }

    if (username.length > 20) {
      return 'Nickname must be at most 20 characters';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Nickname can only contain letters, numbers, and underscores';
    }

    return null;
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      const query = supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', username);

      // Exclude current user if checking for update
      if (currentUserId) {
        query.neq('user_id', currentUserId);
      }

      const { data } = await query.single();
      return !data; // Available if no data found
    } catch {
      // If error is "no rows", username is available
      return true;
    }
  }
}
