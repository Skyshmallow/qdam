import { useEffect, useState } from 'react';
import { useMapStore } from '../store/mapStore';

export const ZoomIndicator = () => {
  const { map } = useMapStore();
  const [zoom, setZoom] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      const currentZoom = Math.round(map.getZoom() * 10) / 10;
      setZoom(currentZoom);
      setIsVisible(true);

      // Hide after 1.5 seconds
      setTimeout(() => setIsVisible(false), 1500);
    };

    map.on('zoom', handleZoom);
    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map]);

  if (!isVisible || zoom === null) return null;

  return (
    <div className="zoom-indicator">
      Zoom: {zoom.toFixed(1)}
    </div>
  );
};