import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';
import { 
  Building2, 
  Moon, 
  Map as MapIcon, 
  Eclipse, 
  Navigation, 
  Satellite, 
  Sun,
  Layers
} from 'lucide-react';
import './LayersOverlay.css';

interface LayersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MapStyle {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
}

const mapStyles: MapStyle[] = [
  {
    id: 'standard',
    name: '3D Standard',
    url: 'mapbox://styles/mapbox/standard',
    icon: <Building2 size={14} />
  },
  {
    id: 'standard-dark',
    name: '3D Dark',
    url: 'mapbox://styles/mapbox/standard',
    icon: <Moon size={14} />
  },
  {
    id: 'streets',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    icon: <MapIcon size={14} />
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    icon: <Eclipse size={14} />
  },
  {
    id: 'navigation-night',
    name: 'Streets Dark',
    url: 'mapbox://styles/mapbox/navigation-night-v1',
    icon: <Navigation size={14} />
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    icon: <Satellite size={14} />
  },
  {
    id: 'light',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    icon: <Sun size={14} />
  }
];

// Light styles that need dark buttons
const LIGHT_STYLES = ['light', 'streets', 'satellite', 'standard'];

export const LayersOverlay = ({ isOpen, onClose }: LayersOverlayProps) => {
  const { map } = useMapStore();
  const { setMapStyleTheme, activeStyleId, setActiveStyleId, setMapStyleLoading } = useUIStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loadingStyleId, setLoadingStyleId] = useState<string | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleStyleChange = (style: MapStyle) => {
    if (!map || loadingStyleId) return; // Prevent changing while loading

    // Set loading state
    setLoadingStyleId(style.id);
    setMapStyleLoading(true);

    // Update UI immediately
    setActiveStyleId(style.id);

    // Add fade effect
    const container = map.getContainer();
    container.style.transition = 'opacity 0.3s';
    container.style.opacity = '0.5';

    // Change style (suppress console warnings)
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = () => { };
    console.error = () => { };

    map.setStyle(style.url);

    // Wait for style to load
    map.once('style.load', () => {
      // Apply lightPreset for 3D styles
      if (style.id === 'standard-dark') {
        map.setConfigProperty('basemap', 'lightPreset', 'night');
      } else if (style.id === 'standard') {
        map.setConfigProperty('basemap', 'lightPreset', 'day');
      }

      // Update theme for sidebar buttons
      const isLightStyle = LIGHT_STYLES.includes(style.id);
      setMapStyleTheme(isLightStyle ? 'light' : 'dark');

      container.style.opacity = '1';

      // Clear loading state
      setLoadingStyleId(null);
      setMapStyleLoading(false);

      // Restore console
      console.warn = originalWarn;
      console.error = originalError;

      // Auto-close after style change
      setTimeout(() => {
        onClose();
      }, 300);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="layers-overlay-mini"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="layers-header">
        <h3>
          <Layers size={14} className="layers-header-icon" />
          Map Theme
        </h3>
      </div>

      <div className="layers-grid">
        {mapStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleChange(style)}
            className={`layer-option ${activeStyleId === style.id ? 'active' : ''} ${loadingStyleId === style.id ? 'loading' : ''}`}
            disabled={!!loadingStyleId}
            data-style={style.id}
          >
            {loadingStyleId === style.id ? (
              <span className="layer-spinner" />
            ) : (
              <span className="layer-icon">{style.icon}</span>
            )}
            <span className="layer-name">{style.name}</span>
            {activeStyleId === style.id && !loadingStyleId && (
              <span className="layer-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};