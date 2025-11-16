/**
 * AuthContext - Authentication Provider
 * 
 * Управляет:
 * - Google OAuth authentication через Supabase
 * - Состояние пользователя (user, session)
 * - Sign in / Sign out
 * - Profile data
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка профиля пользователя из user_profiles
  const loadProfile = async (userId: string, skipLoading = false) => {
    if (!supabase) {
      console.warn('[Auth] Supabase not available for profile load');
      if (!skipLoading) setIsLoading(false);
      return;
    }

    if (!userId) {
      console.warn('[Auth] No userId provided for profile load');
      if (!skipLoading) setIsLoading(false);
      return;
    }

    // ✅ проверка на уже загруженный профиль
    if (profile && profile.user_id === userId && !skipLoading) {
      console.log('[Auth] Profile already loaded, skipping');
      return;
    }

    console.log('[Auth] Loading profile for user:', userId, skipLoading ? '(refresh)' : '(initial)');

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile load error:', error);
        setProfile(null);
        return;
      }

      if (!data) {
        console.warn('[Auth] Profile not found for user:', userId);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
      console.log('[Auth] Profile loaded successfully:', (data as UserProfile)?.username);
    } catch (error) {
      console.error('[Auth] Failed to load profile:', error);
      // Don't block if profile doesn't exist
      setProfile(null);
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
        console.log('[Auth] Profile loading complete, isLoading set to false');
      } else {
        console.log('[Auth] Profile refresh complete');
      }
    }
  };

  // Инициализация: проверка текущей сессии
  useEffect(() => {
    if (!isSupabaseEnabled()) {
      console.warn('[Auth] Supabase not enabled');
      setIsLoading(false);
      return;
    }

    let isInitialized = false; // ✅ Флаг для предотвращения двойной загрузки

    // Safety timeout: force loading to false after 10 seconds (увеличено с 5 до 10)
    const timeoutId = setTimeout(() => {
      console.warn('[Auth] Loading timeout reached (10s), forcing isLoading to false');
      setIsLoading(false);
    }, 10000); // ✅ Увеличили таймаут

    // Получить текущую сессию
    supabase!.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        console.log('[Auth] getSession() returned:', currentSession?.user?.id);
        
        // ✅ Помечаем, что инициализация завершена
        isInitialized = true;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          loadProfile(currentSession.user.id);
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('[Auth] Failed to get session:', error);
        setIsLoading(false);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // Подписаться на изменения auth state
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log('[Auth] State changed:', _event, 'isInitialized:', isInitialized);
      
      // ✅ УБИРАЕМ проверку на INITIAL_SESSION
      // Вместо этого проверяем флаг isInitialized
      
      // Если getSession() уже отработал, пропускаем первое событие
      if (!isInitialized) {
        console.log('[Auth] Skipping auth event - not yet initialized');
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setIsLoading(true);
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);


  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('[Auth] Supabase not initialized');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      console.log('[Auth] Google sign in initiated');
    } catch (error) {
      console.error('[Auth] Google sign in failed:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      throw error;
    }
  };

  // Refresh profile data (doesn't trigger loading state)
  const refreshProfile = async () => {
    if (user) {
      console.log('[Auth] Refreshing profile...');
      await loadProfile(user.id, true); // skipLoading = true
      console.log('[Auth] Profile refresh done');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook для использования auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
