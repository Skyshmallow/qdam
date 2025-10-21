import { useState } from 'react';

export interface AuthState {
  user: null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const signInWithGoogle = async () => {
    console.warn('Authentication disabled - Supabase not configured');
  };

  const signOut = async () => {
    console.warn('Authentication disabled - Supabase not configured');
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signInWithGoogle,
    signOut,
  };
};