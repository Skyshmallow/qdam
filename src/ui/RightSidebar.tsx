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
    <div className="absolute right-4 top-4 flex flex-col gap-3 z-10">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className={`scifi-button scifi-button-zoom-in ${themeClass}`}
        title="Приблизить"
<<<<<<< HEAD
        aria-label="Enlarge view"
=======
        aria-label="Zoom in"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
      >
        <ZoomIn size={20} strokeWidth={2} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className={`scifi-button scifi-button-zoom-out ${themeClass}`}
        title="Отдалить"
<<<<<<< HEAD
        aria-label="Reduce view"
=======
        aria-label="Zoom out"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
      >
        <ZoomOut size={20} strokeWidth={2} />
      </button>

      {/* Layers */}
      <button
        onClick={onLayers}
        className={`scifi-button scifi-button-layers ${themeClass}`}
        title="Слои карты"
<<<<<<< HEAD
        aria-label="Map overlays"
=======
        aria-label="Map layers"
>>>>>>> c3e2608068f28777e16b80a5f4b83e81c8da5dd0
      >
        <Layers size={20} strokeWidth={2} />
      </button>
    </div>
  );
};