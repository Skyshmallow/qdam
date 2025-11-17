import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import { useUIStore } from '../../store/uiStore';

interface LayersOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MapStyle {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const mapStyles: MapStyle[] = [
  {
    id: 'standard',
    name: '3D Standard',
    url: 'mapbox://styles/mapbox/standard',
    icon: '🏙️'
  },
  {
    id: 'standard-dark',
    name: '3D Dark',
    url: 'mapbox://styles/mapbox/standard',
    icon: '🌃'
  },
  {
    id: 'streets',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    icon: '🗺️'
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    icon: '🌙'
  },
  {
    id: 'navigation-night',
    name: 'Streets Dark',
    url: 'mapbox://styles/mapbox/navigation-night-v1',
    icon: '🌃'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    icon: '🛰️'
  },
  {
    id: 'light',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    icon: '☀️'
  }
];

// Light styles that need dark buttons
const LIGHT_STYLES = ['light', 'streets', 'satellite', 'standard'];

export const LayersOverlay = ({ isOpen, onClose }: LayersOverlayProps) => {
  const { map } = useMapStore();
  const { setMapStyleTheme } = useUIStore();
  const [activeStyle, setActiveStyle] = useState<string>('dark');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect current style on mount
  useEffect(() => {
    if (!map) return;
    
    const sprite = map.getStyle()?.sprite || '';
    
    // Match style by checking sprite URL (more precise order matters!)
    if (sprite.includes('satellite-streets') || sprite.includes('satellite')) {
      setActiveStyle('satellite');
    } else if (sprite.includes('navigation-night')) {
      setActiveStyle('navigation-night');
    } else if (sprite.includes('standard')) {
      // Check lightPreset to distinguish standard vs standard-dark
      const lightPreset = map.getConfigProperty('basemap', 'lightPreset');
      if (lightPreset === 'night') {
        setActiveStyle('standard-dark');
      } else {
        setActiveStyle('standard');
      }
    } else if (sprite.includes('streets')) {
      setActiveStyle('streets');
    } else if (sprite.includes('dark')) {
      setActiveStyle('dark');
    } else if (sprite.includes('light')) {
      setActiveStyle('light');
    }
  }, [map]);

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
    if (!map) return;
    
    // Add fade effect
    const container = map.getContainer();
    container.style.transition = 'opacity 0.3s';
    container.style.opacity = '0.5';

    // Change style (suppress console warnings)
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = () => {};
    console.error = () => {};

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
      setActiveStyle(style.id);
      
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
        <h3>🗺️ Map Theme</h3>
      </div>

      <div className="layers-grid">
        {mapStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => handleStyleChange(style)}
            className={`layer-option ${activeStyle === style.id ? 'active' : ''}`}
          >
            <span className="layer-icon">{style.icon}</span>
            <span className="layer-name">{style.name}</span>
            {activeStyle === style.id && (
              <span className="layer-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};