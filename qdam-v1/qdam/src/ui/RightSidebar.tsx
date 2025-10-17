// qdam/qdam-v1/qdam/src/ui/RightSidebar.tsx

import { Plus, Minus, Search, LocateFixed, Layers } from 'lucide-react';
import { IconButton } from './IconButton';

interface RightSidebarProps {
  onMyLocationClick?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSearch?: () => void;
  onLayers?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
  onMyLocationClick,
  onZoomIn,
  onZoomOut, 
  onSearch,
  onLayers
}) => {
  const topButtons = [
    { id: 'zoom-in', icon: <Plus size={13} />, tooltip: 'Zoom In', onClick: onZoomIn },
    { id: 'zoom-out', icon: <Minus size={13} />, tooltip: 'Zoom Out', onClick: onZoomOut },
  ];
  
  const bottomButtons = [
    { id: 'search', icon: <Search size={13} />, tooltip: 'Search', onClick: onSearch },
    { id: 'my-location', icon: <LocateFixed size={13} />, tooltip: 'My Location', onClick: onMyLocationClick },
    { id: 'layers', icon: <Layers size={13} />, tooltip: 'Layers', onClick: onLayers },
  ];

  return (
    <aside className="absolute right-3 top-3 flex flex-col gap-2 z-20">
      <div className="flex flex-col p-1 bg-neutral-800 bg-opacity-80 backdrop-blur-sm rounded-lg shadow-2xl">
        {topButtons.map(btn => (
          <IconButton 
            key={btn.id} 
            icon={btn.icon} 
            tooltip={btn.tooltip} 
            onClick={btn.onClick}
            className="p-2" 
            tooltipPosition="left" 
          />
        ))}
      </div>
      <div className="flex flex-col p-1 bg-neutral-800 bg-opacity-80 backdrop-blur-sm rounded-lg shadow-2xl">
        {bottomButtons.map(btn => (
          <IconButton 
            key={btn.id} 
            icon={btn.icon} 
            tooltip={btn.tooltip} 
            onClick={btn.onClick}
            className="p-2" 
            tooltipPosition="left" 
          />
        ))}
      </div>
    </aside>
  );
};