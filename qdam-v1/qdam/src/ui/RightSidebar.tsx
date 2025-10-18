import { ZoomIn, ZoomOut, Layers } from 'lucide-react';
import './SciFiButton.css';

interface RightSidebarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayers: () => void;
}

export const RightSidebar = ({ 
  onZoomIn, 
  onZoomOut,
  onLayers 
}: RightSidebarProps) => {
  return (
    <div className="absolute right-4 top-4 flex flex-col gap-3 z-10">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="scifi-button scifi-button-zoom-in"
        title="Приблизить"
        aria-label="Zoom in"
      >
        <ZoomIn size={20} strokeWidth={2} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="scifi-button scifi-button-zoom-out"
        title="Отдалить"
        aria-label="Zoom out"
      >
        <ZoomOut size={20} strokeWidth={2} />
      </button>

      {/* Layers */}
      <button
        onClick={onLayers}
        className="scifi-button scifi-button-layers"
        title="Слои карты"
        aria-label="Map layers"
      >
        <Layers size={20} strokeWidth={2} />
      </button>
    </div>
  );
};