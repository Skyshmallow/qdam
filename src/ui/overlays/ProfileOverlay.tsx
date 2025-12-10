import { useState } from 'react';
import { OverlayBase } from './OverlayBase';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { isSupabaseEnabled } from '../../lib/supabase';
import { ProfileService } from '../../services/ProfileService';
import { Pencil, Check, X, Zap, Map, Route, Link2 } from 'lucide-react';
import './ProfileOverlay.css';

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
      <OverlayBase title="⚡ Player HQ" isOpen={isOpen} onClose={onClose}>
        <div className="profile-loading">
          <div className="profile-spinner" />
        </div>
      </OverlayBase>
    );
  }

  // Calculate player level based on territory
  const playerLevel = Math.max(1, Math.floor(stats.territoryKm2 * 10) + 1);
  const getRankTitle = (level: number) => {
    if (level >= 50) return '🏆 Legendary Conqueror';
    if (level >= 30) return '⚔️ Territory Master';
    if (level >= 20) return '🗡️ Land Baron';
    if (level >= 10) return '🛡️ Explorer';
    if (level >= 5) return '🌱 Pathfinder';
    return '🚶 Wanderer';
  };

  return (
    <OverlayBase title="⚡ Player HQ" isOpen={isOpen} onClose={onClose}>
      {!isSupabaseEnabled() ? (
        // Supabase not configured
        <div className="profile-welcome">
          <div className="profile-welcome-icon">🔒</div>
          <h3 className="profile-welcome-title">Coming Soon</h3>
          <p className="profile-welcome-text">
            Authentication is currently disabled.<br/>
            Your progress is saved locally.
          </p>
          <div className="profile-welcome-features">
            <div className="profile-feature-item">
              <span className="profile-feature-icon">☁️</span>
              Cloud sync
            </div>
            <div className="profile-feature-item">
              <span className="profile-feature-icon">📱</span>
              Multi-device support
            </div>
            <div className="profile-feature-item">
              <span className="profile-feature-icon">🏆</span>
              Global leaderboard
            </div>
          </div>
        </div>
      ) : !isAuthenticated ? (
        // Not authenticated - show Google Sign In
        <div className="profile-welcome">
          <div className="profile-welcome-icon">👤</div>
          <h3 className="profile-welcome-title">Добро пожаловать!</h3>
          <div className="profile-welcome-features">
            <div className="profile-feature-item">
              <span className="profile-feature-icon">🔄</span>
              Синхронизация между устройствами
            </div>
            <div className="profile-feature-item">
              <span className="profile-feature-icon">🗺️</span>
              Глобальная карта территорий
            </div>
            <div className="profile-feature-item">
              <span className="profile-feature-icon">⚔️</span>
              Соревнования с друзьями
            </div>
          </div>

          <button onClick={signInWithGoogle} className="profile-google-btn">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </button>

          {/* Stats preview */}
          <div className="profile-stats-grid" style={{ marginTop: '16px' }}>
            <div className="profile-stat-card stat-chains">
              <div className="profile-stat-icon"><Zap size={14} color="#00d9ff" /></div>
              <div className="profile-stat-value">{stats.chainsCreatedToday}/{MAX_CHAINS_PER_DAY}</div>
              <div className="profile-stat-label">Today's Chains</div>
              <div className="profile-progress-bar">
                <div className="profile-progress-fill" style={{ width: `${(stats.chainsCreatedToday / MAX_CHAINS_PER_DAY) * 100}%` }} />
              </div>
            </div>
            <div className="profile-stat-card stat-total">
              <div className="profile-stat-icon"><Link2 size={14} color="#10b981" /></div>
              <div className="profile-stat-value">{stats.totalChains}</div>
              <div className="profile-stat-label">Total Chains</div>
            </div>
            <div className="profile-stat-card stat-territory">
              <div className="profile-stat-icon"><Map size={14} color="#f59e0b" /></div>
              <div className="profile-stat-value">{stats.territoryKm2.toFixed(2)}</div>
              <div className="profile-stat-label">Territory km²</div>
            </div>
            <div className="profile-stat-card stat-distance">
              <div className="profile-stat-icon"><Route size={14} color="#ec4899" /></div>
              <div className="profile-stat-value">{stats.totalDistanceKm.toFixed(1)}</div>
              <div className="profile-stat-label">Distance km</div>
            </div>
          </div>
        </div>
      ) : (
        // Authenticated - show profile
        <div>
          {/* Profile Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="profile-avatar-container">
              <img
                src={profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/80'}
                alt="Avatar"
                className="profile-avatar"
              />
              <div className="profile-level-badge">{playerLevel}</div>
            </div>
            
            <div className="profile-player-info">
              {isEditMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Display Name"
                    className="profile-edit-input"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 text-sm">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="username"
                      className="profile-edit-input flex-1"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
              ) : (
                <>
                  <h3 className="profile-player-name truncate">
                    {profile?.display_name || user?.user_metadata?.full_name || 'Player'}
                  </h3>
                  <p className="profile-player-tag truncate">
                    @{profile?.username || 'anonymous'}
                  </p>
                  <div className="profile-rank">{getRankTitle(playerLevel)}</div>
                </>
              )}
            </div>

            {/* Edit/Save/Cancel buttons */}
            {!isEditMode ? (
              <button onClick={handleStartEdit} className="profile-edit-btn edit" title="Edit profile">
                <Pencil size={16} className="text-cyan-400" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={isSaving} className="profile-edit-btn save" title="Save">
                  <Check size={16} className="text-green-400" />
                </button>
                <button onClick={handleCancelEdit} disabled={isSaving} className="profile-edit-btn cancel" title="Cancel">
                  <X size={16} className="text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-card stat-chains">
              <div className="profile-stat-icon"><Zap size={14} color="#00d9ff" /></div>
              <div className="profile-stat-value">{stats.chainsCreatedToday}/{MAX_CHAINS_PER_DAY}</div>
              <div className="profile-stat-label">Today's Chains</div>
              <div className="profile-progress-bar">
                <div className="profile-progress-fill" style={{ width: `${(stats.chainsCreatedToday / MAX_CHAINS_PER_DAY) * 100}%` }} />
              </div>
            </div>
            <div className="profile-stat-card stat-total">
              <div className="profile-stat-icon"><Link2 size={14} color="#10b981" /></div>
              <div className="profile-stat-value">{stats.totalChains}</div>
              <div className="profile-stat-label">Total Chains</div>
            </div>
            <div className="profile-stat-card stat-territory">
              <div className="profile-stat-icon"><Map size={14} color="#f59e0b" /></div>
              <div className="profile-stat-value">{(profile?.territory_area_km2 || stats.territoryKm2).toFixed(2)}</div>
              <div className="profile-stat-label">Territory km²</div>
            </div>
            <div className="profile-stat-card stat-distance">
              <div className="profile-stat-icon"><Route size={14} color="#ec4899" /></div>
              <div className="profile-stat-value">{stats.totalDistanceKm.toFixed(1)}</div>
              <div className="profile-stat-label">Distance km</div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button onClick={signOut} className="profile-signout-btn">
            Sign Out
          </button>
        </div>
      )}
    </OverlayBase>
  );
}