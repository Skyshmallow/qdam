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
}

export const LeftSidebar = ({
  onProfileClick,
  onHistoryClick,
  onMyLocationClick,
  geolocationState,
  isSimulating,
  onSimulateClick,
}: LeftSidebarProps) => {

  // Helper to determine geolocation button class
  const getGeolocationClass = () => {
    if (geolocationState === 'success') return 'success';
    if (geolocationState === 'denied' || geolocationState === 'error') return 'error';
    if (geolocationState === 'prompting' || geolocationState === 'locating') return 'loading';
    return '';
  };

  const isGeolocationBusy = geolocationState === 'prompting' || geolocationState === 'locating';
  
  return (
    <div className="absolute left-4 top-4 flex flex-col gap-3 z-10">
      {/* Profile */}
      <button
        onClick={onProfileClick}
        className="scifi-button scifi-button-profile"
        title="Профиль"
        aria-label="Profile"
      >
        <User size={20} strokeWidth={2} />
      </button>

      {/* History */}
      <button
        onClick={onHistoryClick}
        className="scifi-button scifi-button-history"
        title="История"
        aria-label="History"
      >
        <History size={20} strokeWidth={2} />
      </button>

      {/* Find Me */}
      <button
        onClick={onMyLocationClick}
        className={`scifi-button scifi-button-location ${getGeolocationClass()}`}
        title="Моё местоположение"
        aria-label="My Location"
        disabled={isGeolocationBusy}
      >
        {isGeolocationBusy ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
        ) : (
          <MapPin size={20} strokeWidth={2} />
        )}
      </button>

      {/* Simulate Button */}
      <button
        onClick={onSimulateClick}
        className={`scifi-button scifi-button-simulate ${isSimulating ? 'active' : ''}`}
        title={isSimulating ? "Остановить симуляцию" : "Режим симуляции"}
        aria-label={isSimulating ? "Stop Simulation" : "Start Simulation"}
      >
        <FlaskConical size={20} strokeWidth={2} />
      </button>
    </div>
  );
};