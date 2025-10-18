import { OverlayBase } from './OverlayBase';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  return (
    <OverlayBase 
      title="Profile" 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white">
            👤
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Change Avatar
          </button>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            defaultValue="Traveler"
            className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Enter your username"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">0</div>
            <div className="text-sm text-gray-400">Total Journeys</div>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">0</div>
            <div className="text-sm text-gray-400">Castles Built</div>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">0 km</div>
            <div className="text-sm text-gray-400">Distance Traveled</div>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">0</div>
            <div className="text-sm text-gray-400">Achievements</div>
          </div>
        </div>

        {/* Save Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
          Save Changes
        </button>
      </div>
    </OverlayBase>
  );
}
