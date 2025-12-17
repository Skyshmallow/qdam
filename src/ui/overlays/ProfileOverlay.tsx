import { useState } from 'react';
import { OverlayBase } from './OverlayBase';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { isSupabaseEnabled } from '../../lib/supabase';
import { ProfileService } from '../../services/ProfileService';
import { Pencil, Check, X } from 'lucide-react';

const MAX_CHAINS_PER_DAY = Number(import.meta.env.VITE_MAX_CHAINS_PER_DAY) || 2;

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    refreshProfile
  } = useAuth();
  const stats = usePlayerStats();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start editing
  const handleStartEdit = () => {
    setEditDisplayName(profile?.display_name || '');
    setEditUsername(profile?.username || '');
    setIsEditMode(true);
    setError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      console.log('[ProfileOverlay] Saving profile changes...');

      // Timeout protection: 10 seconds max
      const savePromise = ProfileService.updateProfile(user.id, {
        display_name: editDisplayName.trim() || undefined,
        username: editUsername.trim() || undefined,
      });

      const timeoutPromise = new Promise<{ success: boolean; error: string }>((resolve) => {
        setTimeout(() => {
          resolve({ success: false, error: 'Save timeout (10s)' });
        }, 10000);
      });

      const result = await Promise.race([savePromise, timeoutPromise]);

      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        console.error('[ProfileOverlay] Save failed:', result.error);
        return;
      }

      console.log('[ProfileOverlay] Profile saved, refreshing...');

      // Refresh profile data with timeout
      const refreshPromise = refreshProfile();
      const refreshTimeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('[ProfileOverlay] Refresh timeout, continuing anyway');
          resolve();
        }, 5000);
      });

      await Promise.race([refreshPromise, refreshTimeout]);

      setIsEditMode(false);
      console.log('[ProfileOverlay] Profile updated successfully');
    } catch (err) {
      setError('Failed to save changes');
      console.error('[ProfileOverlay] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
<<<<<<< HEAD
      <OverlayBase title="Player Account" isOpen={isOpen} onClose={onClose}>
=======
      <OverlayBase title="Player Profile" isOpen={isOpen} onClose={onClose}>
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      </OverlayBase>
    );
  }

  return (
    <OverlayBase title="Player Profile" isOpen={isOpen} onClose={onClose}>
      {!isSupabaseEnabled() ? (
        // Supabase not configured
        <div className="text-center py-12 px-6">
          <div className="text-6xl mb-6">🔒</div>
          <h3 className="text-2xl font-bold mb-3 text-cyan-400">
            Sign In Coming Soon
          </h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Authentication is currently disabled.
            <br />
            Your progress is saved locally on this device.
            <br />
            <br />
            Coming soon:
            <br />
            ✓ Cloud sync
            <br />
            ✓ Multi-device support
            <br />
            ✓ Global leaderboard
          </p>
        </div>
      ) : !isAuthenticated ? (
        // Not authenticated - show Google Sign In
        <div className="text-center py-12 px-6">
          <div className="text-6xl mb-6">👤</div>
          <h3 className="text-2xl font-bold mb-3 text-cyan-400">
            Добро пожаловать!
          </h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Войдите через Google, чтобы:
            <br />
            ✓ Синхронизировать прогресс между устройствами
            <br />
            ✓ Участвовать в глобальной карте территорий
            <br />
            ✓ Соревноваться с друзьями
          </p>

          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            aria-label="Sign in with Google"
            data-testid="profile-signin"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          Войти через Google
          </button>

          {/* Show local stats while not authenticated */}
          <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Chains Today
              </p>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.chainsCreatedToday} / {MAX_CHAINS_PER_DAY}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Total Chains
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalChains}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Territory
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.territoryKm2.toFixed(2)} km²
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Distance
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalDistanceKm.toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Authenticated - show profile
        <div className="py-8 px-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src={profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/80'}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-cyan-400 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              {isEditMode ? (
                // Edit mode
                <div className="space-y-2 min-w-0">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Display Name"
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-400 focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 flex-shrink-0">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="nickname"
                      className="flex-1 min-w-0 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-400 focus:outline-none text-sm"
                    />
                  </div>
                  {error && (
                    <p className="text-red-400 text-xs break-words">{error}</p>
                  )}
                </div>
              ) : (
                // View mode
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-white truncate">
                    {profile?.display_name || user?.user_metadata?.full_name || 'Player'}
                  </h3>
                  <p className="text-cyan-400 text-sm truncate">
                    @{profile?.username || 'anonymous'}
                  </p>
                  {profile?.email && (
                    <p className="text-gray-400 text-xs mt-1 truncate">
                      {profile.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Edit/Save/Cancel buttons */}
            {!isEditMode ? (
              <button
                onClick={handleStartEdit}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Edit profile"
              >
                <Pencil size={18} className="text-cyan-400" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check size={18} className="text-white" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Chains Today
              </p>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.chainsCreatedToday} / {MAX_CHAINS_PER_DAY}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Total Chains
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalChains}
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Territory
              </p>
              <p className="text-2xl font-bold text-white">
                {profile?.territory_area_km2?.toFixed(2) || stats.territoryKm2.toFixed(2)} km²
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Distance
              </p>
              <p className="text-2xl font-bold text-white">
                {stats.totalDistanceKm.toFixed(1)} km
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            aria-label="Sign out"
            data-testid="profile-signout"
          >
            Sign out
          </button>
        </div>
      )}
    </OverlayBase>
  );
}