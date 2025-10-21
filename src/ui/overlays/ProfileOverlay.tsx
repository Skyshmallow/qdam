import { OverlayBase } from './OverlayBase';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayerStats';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { loading } = useAuth();
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
      {/* 🔒 NOT AUTHENTICATED - Always show this since Supabase is disabled */}
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
        
        {/* Show local stats */}
        <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
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
      </div>
    </OverlayBase>
  );
}