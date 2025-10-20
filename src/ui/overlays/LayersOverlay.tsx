import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../../store/mapStore';

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

export const LayersOverlay = ({ isOpen, onClose }: LayersOverlayProps) => {
  const { map } = useMapStore();
  const [activeStyle, setActiveStyle] = useState<string>('dark');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect current style on mount
  useEffect(() => {
    if (!map) return;
    
    const currentStyleUrl = map.getStyle()?.sprite;
    if (currentStyleUrl) {
      const style = mapStyles.find(s => currentStyleUrl.includes(s.id));
      if (style) setActiveStyle(style.id);
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

    console.log(`[LayersOverlay] Changing map style to: ${style.name}`);
    
    // Add fade effect
    const container = map.getContainer();
    container.style.transition = 'opacity 0.3s';
    container.style.opacity = '0.5';

    // Change style
    map.setStyle(style.url);

    // Wait for style to load
    map.once('style.load', () => {
      console.log(`[LayersOverlay] Style loaded: ${style.name}`);
      container.style.opacity = '1';
      setActiveStyle(style.id);
      
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