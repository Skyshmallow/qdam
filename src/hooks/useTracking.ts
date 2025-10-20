// src/hooks/useTracking.ts

import { useState, useCallback } from 'react';
import type { TrackingState } from '../types';

export const useTracking = () => {
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  // The watchIdRef is no longer needed as we'll rely on the Map's GeolocateControl.

  const startTracking = useCallback(() => {
    console.log('%c[useTracking] > startTracking called! Changing state to "recording"', 'color: #f0ad4e; font-weight: bold;');
    setCurrentPath([]);
    setTrackingState('recording');
  }, []);

  const pauseTracking = useCallback(() => {
    console.log('%c[useTracking] > pauseTracking called! Changing state to "paused"', 'color: #f0ad4e;');
    setTrackingState('paused');
  }, []);

  const resumeTracking = useCallback(() => {
    console.log('%c[useTracking] > resumeTracking called! Changing state back to "recording"', 'color: #f0ad4e;');
    setTrackingState('recording');
  }, []);

  const stopTracking = useCallback(() => {
    console.log('%c[useTracking] > stopTracking called! Changing state to "idle"', 'color: #f0ad4e;');
    setTrackingState('idle');
    return currentPath;
  }, [currentPath]);

  // This function adds a new point to the path if tracking is active.
  const addPathPoint = useCallback((point: number[]) => {
      // The check happens here, using the hook's own up-to-date state.
      if (trackingState === 'recording') {
        setCurrentPath(prevPath => [...prevPath, point]);
      }
  }, [trackingState]);


  return {
    trackingState,
    currentPath,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    addPathPoint,
    clearCurrentPath: () => setCurrentPath([])
  };
};