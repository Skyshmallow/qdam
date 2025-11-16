/**
 * Supabase Client Configuration
 * 
 * Обеспечивает:
 * - Authentication (Google OAuth)
 * - Database access (profiles, nodes, chains)
 * - Real-time subscriptions (для будущего мультиплеера)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables (будут в .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверка конфигурации
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Environment variables not found. Supabase features disabled.');
}

/**
 * Supabase client instance
 * Типизирован через Database интерфейс для type-safety
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage, // Используем localStorage для сессии
      },
    })
  : null;

/**
 * Проверка доступности Supabase
 */
export const isSupabaseEnabled = (): boolean => {
  return supabase !== null;
};

/**
 * Helper для проверки подключения
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    console.warn('[Supabase] Client not initialized');
    return false;
  }

  try {
    const { error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('[Supabase] Connection successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection failed:', error);
    return false;
  }
};