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
    <div className="absolute left-3 top-3 flex flex-col gap-2 z-10 sm:left-4 sm:top-4 sm:gap-3">
      {/* Profile */}
      <button
        onClick={onProfileClick}
        className={`scifi-button scifi-button-profile ${themeClass}`}
        title="Профиль"
        aria-label="Profile"
      >
        <User size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
      </button>

      {/* History */}
      <button
        onClick={onHistoryClick}
        className={`scifi-button scifi-button-history ${themeClass}`}
        title="История"
        aria-label="History"
      >
        <History size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
      </button>

      {/* Find Me */}
      <button
        onClick={onMyLocationClick}
        className={`scifi-button scifi-button-location ${getGeolocationClass()} ${themeClass}`}
        title="Моё местоположение"
        aria-label="My Location"
        disabled={isGeolocationBusy}
      >
        {isGeolocationBusy ? (
          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full spinner" />
        ) : (
          <MapPin size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
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
          <FlaskConical size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};