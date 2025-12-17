import { User, History, MapPin, FlaskConical } from 'lucide-react';
import type { GeolocationState } from '../hooks/useGeolocation';
import './SciFiButton.css';

interface LeftSidebarProps {
  onProfileClick: () => void;
  onHistoryClick: () => void;
  onMyLocationClick: () => void;
  geolocationState: GeolocationState;
  isSimulating: boolean;
  onSimulateClick: () => void;
  isDeveloper: boolean;
  mapStyleTheme?: 'light' | 'dark';
}

export const LeftSidebar = ({
  onProfileClick,
  onHistoryClick,
  onMyLocationClick,
  geolocationState,
  isSimulating,
  onSimulateClick,
  isDeveloper,
  mapStyleTheme = 'dark',
}: LeftSidebarProps) => {

  // Helper to determine geolocation button class
  const getGeolocationClass = () => {
    if (geolocationState === 'success') return 'success';
    if (geolocationState === 'denied' || geolocationState === 'error') return 'error';
    if (geolocationState === 'prompting' || geolocationState === 'locating') return 'loading';
    return '';
  };

  const isGeolocationBusy = geolocationState === 'prompting' || geolocationState === 'locating';
  
  const themeClass = mapStyleTheme === 'light' ? 'theme-light' : '';

  return (
    <div className="absolute left-4 top-4 flex flex-col gap-3 z-10">
      {/* Profile */}
      <button
        onClick={onProfileClick}
        className={`scifi-button scifi-button-profile ${themeClass}`}
        title="Профиль"
<<<<<<< HEAD
        aria-label="User Account"
=======
        aria-label="Profile"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
      >
        <User size={20} strokeWidth={2} />
      </button>

      {/* History */}
      <button
        onClick={onHistoryClick}
        className={`scifi-button scifi-button-history ${themeClass}`}
        title="История"
<<<<<<< HEAD
        aria-label="Activity Log"
=======
        aria-label="History"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
      >
        <History size={20} strokeWidth={2} />
      </button>

      {/* Find Me */}
      <button
        onClick={onMyLocationClick}
        className={`scifi-button scifi-button-location ${getGeolocationClass()} ${themeClass}`}
        title="Моё местоположение"
<<<<<<< HEAD
        aria-label="Current Position"
=======
        aria-label="My Location"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
        disabled={isGeolocationBusy}
      >
        {isGeolocationBusy ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
        ) : (
          <MapPin size={20} strokeWidth={2} />
        )}
      </button>

      {/* Simulate Button - Only visible to developers */}
      {isDeveloper && (
        <button
          onClick={onSimulateClick}
          className={`scifi-button scifi-button-simulate ${isSimulating ? 'active' : ''} ${themeClass}`}
          title={isSimulating ? "Остановить симуляцию" : "Режим симуляции"}
          aria-label={isSimulating ? "Stop Simulation" : "Start Simulation"}
        >
          <FlaskConical size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
};