// src/components/TrackingControls.tsx

import { Play, Pause, Square, Trash2 } from 'lucide-react';
import type { TrackingState } from '../types';
import { GameButton } from '../ui/buttons/GameButton';
import { useViewportHeight } from '../hooks/useViewportHeight';

type ActivityState =
  | 'idle'
  | 'tracking'
  | 'tracking_paused'
  | 'planning_start'
  | 'planning_end'
  | 'ready_to_simulate'
  | 'simulating';

interface TrackingControlsProps {
  activityState: ActivityState;
  trackingState?: TrackingState; 
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isSimulationMode: boolean;
  onClearTestData: () => void;
}

export function TrackingControls({
  activityState,
  onStart,
  onPause,
  onResume,
  onStop,
  isSimulationMode,
  onClearTestData,
}: TrackingControlsProps) {

  useViewportHeight();

  const renderControls = () => {
    // === IDLE STATE ===
    if (activityState === 'idle') {
      // If simulation mode is active, show only Clear Test Data
      if (isSimulationMode) {
        return (
          <div className="flex gap-2">
            <GameButton
              onClick={onClearTestData}
              variant="danger"
              icon={<Trash2 size={20} />}
            >
              Clear Test Data
            </GameButton>
          </div>
        );
      }

      // Normal mode: show Start Walk button
      return (
        <div className="flex gap-2">
          <GameButton
            onClick={onStart}
            variant="success"
            size="lg"
            icon={<Play size={20} />}
          >
            Start Journey
          </GameButton>
        </div>
      );
    }

    // === TRACKING (Real Walk) ===
    if (activityState === 'tracking') {
      return (
        <div className="flex gap-2">
          <GameButton
            onClick={onPause}
            variant="warning"
            icon={<Pause size={20} />}
          >
            Pause
          </GameButton>
          <GameButton
            onClick={onStop}
            variant="danger"
            icon={<Square size={20} />}
          >
            Finish Journey
          </GameButton>
        </div>
      );
    }

    // === PAUSED ===
    if (activityState === 'tracking_paused') {
      return (
        <div className="flex gap-2">
          <GameButton
            onClick={onResume}
            variant="success"
            icon={<Play size={20} />}
          >
            Resume
          </GameButton>
          <GameButton
            onClick={onStop}
            variant="danger"
            icon={<Square size={20} />}
          >
            Finish
          </GameButton>
        </div>
      );
    }

    // === PLANNING MODE (Selecting Points) ===
    if (activityState === 'planning_start') {
      return (
        <div className="flex flex-col gap-2">
          <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-medium">
            📍 Select start point on map
          </div>
          <GameButton
            onClick={onClearTestData}
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
          >
            Clear Test Data
          </GameButton>
        </div>
      );
    }

    if (activityState === 'planning_end') {
      return (
        <div className="flex flex-col gap-2">
          <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-medium">
            📍 Select end point on map
          </div>
          <GameButton
            onClick={onClearTestData}
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
          >
            Clear Test Data
          </GameButton>
        </div>
      );
    }

    // === READY TO SIMULATE ===
    if (activityState === 'ready_to_simulate') {
      return (
        <div className="flex gap-2">
          <GameButton
            onClick={onStart}
            variant="primary"
            icon={<Play size={20} />}
          >
            Play Simulation
          </GameButton>
          <GameButton
            onClick={onClearTestData}
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
          >
            Clear Test Data
          </GameButton>
        </div>
      );
    }

    // === SIMULATING ===
    if (activityState === 'simulating') {
      return (
        <div className="flex flex-col gap-2">
          <GameButton
            onClick={onStop}
            variant="danger"
            icon={<Square size={20} />}
          >
            Stop & Create Castles
          </GameButton>
          
          {isSimulationMode && (
            <div className="text-center text-xs text-yellow-300 bg-black/30 px-2 py-1 rounded">
              ⚠️ Castles will be temporary (won't be saved)
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="tracking-controls">
      {renderControls()}
    </div>
  );
};