import { Play, Pause, Square, Trash2 } from 'lucide-react';
import type { TrackingState } from '../types';

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
  trackingState: TrackingState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  // NEW: Simulation mode props
  isSimulationMode: boolean;
  onClearTestData: () => void;
}

export const TrackingControls = ({
  activityState,
  trackingState,
  onStart,
  onPause,
  onResume,
  onStop,
  isSimulationMode,
  onClearTestData,
}: TrackingControlsProps) => {
  const renderControls = () => {
    // === IDLE STATE ===
    if (activityState === 'idle') {
      // If simulation mode is active, show only Clear Test Data
      if (isSimulationMode) {
        return (
          <div className="flex gap-2">
            <button
              onClick={onClearTestData}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              title="Удалить все тестовые данные"
            >
              <Trash2 size={20} />
              <span>🗑️ Clear Test Data</span>
            </button>
          </div>
        );
      }

      // Normal mode: show Start Walk button
      return (
        <div className="flex gap-2">
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Начать реальный поход с GPS-трекингом"
          >
            <Play size={20} />
            <span>🚶 Начать Поход</span>
          </button>
        </div>
      );
    }

    // === TRACKING (Real Walk) ===
    if (activityState === 'tracking') {
      return (
        <div className="flex gap-2">
          <button
            onClick={onPause}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Приостановить поход"
          >
            <Pause size={20} />
            <span>Пауза</span>
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Завершить поход и создать цепочку"
          >
            <Square size={20} />
            <span>Завершить Поход</span>
          </button>
        </div>
      );
    }

    // === PAUSED ===
    if (activityState === 'tracking_paused') {
      return (
        <div className="flex gap-2">
          <button
            onClick={onResume}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Продолжить поход"
          >
            <Play size={20} />
            <span>Продолжить</span>
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Завершить поход"
          >
            <Square size={20} />
            <span>Завершить</span>
          </button>
        </div>
      );
    }

    // === PLANNING MODE (Selecting Points) ===
    if (activityState === 'planning_start') {
      return (
        <div className="flex flex-col gap-2">
          <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-medium">
            📍 Выберите начальную точку на карте
          </div>
          <button
            onClick={onClearTestData}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            title="Удалить тестовые данные"
          >
            <Trash2 size={16} />
            <span>Clear Test Data</span>
          </button>
        </div>
      );
    }

    if (activityState === 'planning_end') {
      return (
        <div className="flex flex-col gap-2">
          <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-medium">
            📍 Выберите конечную точку на карте
          </div>
          <button
            onClick={onClearTestData}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            title="Удалить тестовые данные"
          >
            <Trash2 size={16} />
            <span>Clear Test Data</span>
          </button>
        </div>
      );
    }

    // === READY TO SIMULATE ===
    if (activityState === 'ready_to_simulate') {
      return (
        <div className="flex gap-2">
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Запустить симуляцию движения по маршруту"
          >
            <Play size={20} />
            <span>▶️ Play Simulation</span>
          </button>
          <button
            onClick={onClearTestData}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            title="Удалить тестовые данные"
          >
            <Trash2 size={16} />
            <span>Clear Test Data</span>
          </button>
        </div>
      );
    }

    // === SIMULATING ===
    if (activityState === 'simulating') {
      return (
        <div className="flex flex-col gap-2">
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            title="Остановить симуляцию и создать замки"
          >
            <Square size={20} />
            <span>⏹️ Stop & Create Castles</span>
          </button>
          
          {isSimulationMode && (
            <div className="text-center text-xs text-yellow-300 bg-black/30 px-2 py-1 rounded">
              ⚠️ Замки будут временными (не сохранятся)
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      {renderControls()}
    </div>
  );
};