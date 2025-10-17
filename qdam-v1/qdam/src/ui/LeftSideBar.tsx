import { User, History, MapPin, FlaskConical } from 'lucide-react';
import type { GeolocationState } from '../hooks/useGeolocation';

interface LeftSidebarProps {
  onProfileClick: () => void;
  onHistoryClick: () => void;
  onMyLocationClick: () => void;
  geolocationState: GeolocationState;
  isSimulating: boolean;
  onSimulateClick: () => void;
}

export const LeftSidebar = ({
  onProfileClick,
  onHistoryClick,
  onMyLocationClick,
  geolocationState,
  isSimulating,
  onSimulateClick,
}: LeftSidebarProps) => {

  // Button base classes
  const baseClasses = 'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110';
  
  // Helper to determine geolocation button style
  const getGeolocationClasses = () => {
    if (geolocationState === 'success') {
      return 'bg-green-500 text-white hover:bg-green-600';
    }
    if (geolocationState === 'denied') {
      return 'bg-red-500 text-white hover:bg-red-600';
    }
    if (geolocationState === 'error') {
      return 'bg-orange-500 text-white hover:bg-orange-600';
    }
    if (geolocationState === 'prompting' || geolocationState === 'locating') {
      return 'bg-white/90 text-gray-800 hover:bg-white opacity-50 cursor-not-allowed';
    }
    return 'bg-white/90 text-gray-800 hover:bg-white';
  };

  const isGeolocationBusy = geolocationState === 'prompting' || geolocationState === 'locating';
  
  return (
    <div className="absolute left-4 top-4 flex flex-col gap-4 z-10">
      {/* Profile */}
      <button
        onClick={onProfileClick}
        className={`${baseClasses} bg-white/90 text-gray-800 hover:bg-white`}
        title="Профиль"
        aria-label="Profile"
      >
        <User size={20} />
      </button>

      {/* History */}
      <button
        onClick={onHistoryClick}
        className={`${baseClasses} bg-white/90 text-gray-800 hover:bg-white`}
        title="История"
        aria-label="History"
      >
        <History size={20} />
      </button>

      {/* Find Me */}
      <button
        onClick={onMyLocationClick}
        className={`${baseClasses} ${getGeolocationClasses()}`}
        title="Моё местоположение"
        aria-label="My Location"
        disabled={isGeolocationBusy}
      >
        {isGeolocationBusy ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <MapPin size={20} />
        )}
      </button>

      {/* NEW: Simulate Button */}
      <button
        onClick={onSimulateClick}
        className={`${baseClasses} ${
          isSimulating
            ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-yellow-500 animate-pulse'
            : 'bg-white/90 text-gray-800 hover:bg-white'
        }`}
        title={isSimulating ? "Остановить симуляцию" : "Режим симуляции"}
        aria-label={isSimulating ? "Stop Simulation" : "Start Simulation"}
      >
        <FlaskConical size={20} />
      </button>
    </div>
  );
};