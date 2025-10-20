import { OverlayBase } from './OverlayBase';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayerStats';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const stats = usePlayerStats();

  if (loading) {
    return (
      <OverlayBase title="Player Profile" isOpen={isOpen} onClose={onClose}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
        </div>
      </OverlayBase>
    );
  }

  return (
    <OverlayBase title="Player Profile" isOpen={isOpen} onClose={onClose}>
      {!user ? (
        // 🔒 NOT AUTHENTICATED
        <div className="text-center py-12 px-6">
          <div className="text-6xl mb-6">🔒</div>
          <h3 className="text-2xl font-bold mb-3 text-cyan-400">
            Sign In Required
          </h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Sign in with Google to:
            <br />
            ✓ Save your progress in the cloud
            <br />
            ✓ Sync across multiple devices
            <br />
            ✓ Compete on the leaderboard
          </p>
          <button
            onClick={signInWithGoogle}
            className="scifi-button w-full max-w-xs mx-auto flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      ) : (
        // ✅ AUTHENTICATED
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-700">
            <img
              src={user.user_metadata?.avatar_url || '/default-avatar.png'}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-cyan-400"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {user.user_metadata?.full_name || 'Player'}
              </h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Chains Today
              </p>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.chainsCreatedToday} / 3
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

          {/* Actions */}
          <button
            onClick={signOut}
            className="scifi-button w-full bg-red-600/20 hover:bg-red-600/30 border-red-600"
          >
            Sign Out
          </button>
        </div>
      )}
    </OverlayBase>
  );
}