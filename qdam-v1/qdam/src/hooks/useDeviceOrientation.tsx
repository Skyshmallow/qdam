// src/hooks/useDeviceOrientation.ts
import { useEffect } from 'react';
import { useMapStore } from '../store/mapStore';

export const useDeviceOrientation = (isActive: boolean) => {
  const setBearing = useMapStore((state) => state.setBearing);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setBearing(event.alpha);
      }
    };

    console.log('[useDeviceOrientation] > Starting to listen for device orientation.');
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      console.log('[useDeviceOrientation] > Stopping device orientation listener.');
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isActive, setBearing]); 
};