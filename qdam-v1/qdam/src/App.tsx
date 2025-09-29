import { useState, useEffect, useRef } from 'react';
import type { Coordinate, Path, Territory } from './types';
import * as turf from '@turf/turf';

import Map from './components/MapComponent';
import Controls from './components/Controls';
import Stats from './components/Stats';

// Main App Component - The Brain
function App() {
  // State Management
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [userPosition, setUserPosition] = useState<Coordinate | null>(null);
  const [currentPath, setCurrentPath] = useState<Path>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [todayDistance, setTodayDistance] = useState<number>(0);
  const totalArea = territories.reduce((sum, t) => sum + t.area, 0);

  // useRef is used to keep track of the GPS watcher ID without causing re-renders
  const watchIdRef = useRef<number | null>(null);

  // Load saved data from localStorage on initial component mount
  useEffect(() => {
    const savedTerritories = localStorage.getItem('territories');
    if (savedTerritories) {
      setTerritories(JSON.parse(savedTerritories));
    }
    const savedDistance = localStorage.getItem('todayDistance');
    if (savedDistance) {
      setTodayDistance(parseFloat(savedDistance));
    }
  }, []);

  // Get initial GPS position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserPosition([longitude, latitude]);
      },
      (error) => console.error("Error getting position:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  // --- Core Logic Functions ---

  const handleStart = () => {
    if (!userPosition) {
      alert("Cannot find your location. Please enable GPS.");
      return;
    }
    setIsWalking(true);
    setCurrentPath([userPosition]); // Start path from current location

    // Start watching GPS position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const newPoint: Coordinate = [longitude, latitude];
        setUserPosition(newPoint);

        // Update path and distance with manual distance filtering
        setCurrentPath((prevPath) => {
          const lastPoint = prevPath[prevPath.length - 1];
          const distanceMoved = turf.distance(turf.point(lastPoint), turf.point(newPoint), { units: 'meters' });

          // Only update if moved more than 10 meters (manual distance filter)
          if (distanceMoved >= 10) {
            setTodayDistance(prevDist => {
                const newTotal = prevDist + distanceMoved;
                localStorage.setItem('todayDistance', newTotal.toString());
                return newTotal;
            });

            return [...prevPath, newPoint];
          }
          
          return prevPath; // Don't update path if movement is less than 10 meters
        });
      },
      (error) => console.error("GPS Watch Error:", error),
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const handleStop = () => {
    setIsWalking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    // Check if the path can form a territory
    if (currentPath.length > 3) {
        // Create a closed loop by adding the first point to the end
        const closedPath = [...currentPath, currentPath[0]];
        const polygon = turf.polygon([closedPath]); // Turf requires polygons to be nested in an array
        const area = turf.area(polygon);

        if (area > 50) { // Minimum 50 square meters
            const newTerritory: Territory = {
                id: Date.now().toString(),
                coords: closedPath,
                area: area,
            };

            setTerritories(prevTerritories => {
                const updatedTerritories = [...prevTerritories, newTerritory];
                localStorage.setItem('territories', JSON.stringify(updatedTerritories));
                return updatedTerritories;
            });
            
            alert(`Territory Captured! Area: ${Math.round(area)} m²`);
        }
    }
    
    setCurrentPath([]); // Clear the path after stopping
  };

  // --- Render the UI ---
  return (
    <div className="relative w-screen h-screen">
      <Map userPosition={userPosition} currentPath={currentPath} territories={territories} />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Stats todayDistance={todayDistance} totalArea={totalArea} />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <Controls
          isWalking={isWalking}
          onStart={handleStart}
          onStop={handleStop}
          todayDistance={todayDistance}
        />
      </div>
    </div>
  );
}

export default App;