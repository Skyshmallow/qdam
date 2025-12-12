import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import './SciFiButton.css';

interface RightSidebarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayers: () => void;
  mapStyleTheme?: 'light' | 'dark';
}

export const RightSidebar = ({ 
  onZoomIn, 
  onZoomOut,
  onLayers,
  mapStyleTheme = 'dark'
}: RightSidebarProps) => {
  const themeClass = mapStyleTheme === 'light' ? 'theme-light' : '';

  return (
    <div className="absolute right-3 top-3 flex flex-col gap-2 z-10 sm:right-4 sm:top-4 sm:gap-3">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className={`scifi-button scifi-button-zoom-in ${themeClass}`}
        title="Приблизить"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className={`scifi-button scifi-button-zoom-out ${themeClass}`}
        title="Отдалить"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
      </button>

      {/* Layers */}
      <button
        onClick={onLayers}
        className={`scifi-button scifi-button-layers ${themeClass}`}
        title="Слои карты"
        aria-label="Map layers"
        data-tutorial-id="btn-layers"
      >
        <Layers size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
      </button>
    </div>
  );
};