// src/ui/LeftSideBar.tsx
import React from 'react';
import { User, History, Navigation, Loader2, NavigationOff } from 'lucide-react';
import { IconButton } from './IconButton';
import type { GeolocationState } from '../hooks/useGeolocation';

const ActionIconButton: React.FC<{
    icon: React.ReactNode;
    tooltip: string;
    onClick?: () => void;
    isDisabled?: boolean;
}> = ({ icon, tooltip, onClick, isDisabled = false }) => (
    <div className="relative group mt-2">
        <button
            onClick={() => {
                // --- LOG ---
                console.log('%c[LeftSidebar]', 'color: #8A2BE2; font-weight: bold;', 'ActionIconButton clicked!');
                onClick?.();
            }}
            disabled={isDisabled}
            className="p-3.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform duration-200 ease-in-out active:scale-100 disabled:from-gray-500 disabled:to-gray-600 disabled:scale-100 disabled:cursor-not-allowed"
        >
            {icon}
        </button>
        <div className={`absolute px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-y-1/2 top-1/2 left-full ml-3`}>
            {tooltip}
        </div>
    </div>
);


interface LeftSidebarProps {
  onProfileClick?: () => void;
  onHistoryClick?: () => void;
  onMyLocationClick?: () => void;
  geolocationState: GeolocationState;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onProfileClick,
  onHistoryClick,
  onMyLocationClick,
  geolocationState,
}) => {
  
  const renderLocateButton = () => {
    let icon: React.ReactNode;
    let tooltip: string;
    let isDisabled = false;

    switch (geolocationState) {
      case 'prompting':
      case 'locating':
        icon = <Loader2 size={15} className="animate-spin" />;
        tooltip = 'Locating...';
        isDisabled = true;
        break;
      case 'denied':
      case 'error':
        icon = <NavigationOff size={15} />;
        tooltip = 'Geolocation is unavailable';
        isDisabled = false; 
        break;
      case 'success':
      case 'idle':
      default:
        icon = <Navigation size={15} />;
        tooltip = geolocationState === 'success' ? 'Center on me' : 'Find me';
        isDisabled = false;
        break;
    }

    return (
      <ActionIconButton
        icon={icon}
        tooltip={tooltip}
        onClick={onMyLocationClick}
        isDisabled={isDisabled}
      />
    );
  };
    
  return (
    <aside className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 p-1.5 bg-neutral-800 bg-opacity-80 backdrop-blur-sm rounded-lg shadow-2xl z-20">
      <div className="flex flex-col gap-1">
        <IconButton icon={<User size={13} />} tooltip={'Profile'} onClick={onProfileClick} />
        <IconButton icon={<History size={13} />} tooltip={'History'} onClick={onHistoryClick} />
      </div>
      {renderLocateButton()}
    </aside>
  );
};