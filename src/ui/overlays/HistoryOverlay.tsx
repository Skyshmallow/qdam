import { OverlayBase } from './OverlayBase';

interface HistoryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryOverlay({ isOpen, onClose }: HistoryOverlayProps) {
  return (
    <OverlayBase 
      title="Activity Log" 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="lg"
    >
      <div className="text-center py-12" data-testid="history-empty">
        <div className="text-6xl mb-4">📜</div>
        <h3 className="text-xl font-semibold text-white mb-2">No journeys yet</h3>
        <p className="text-gray-400">
          Start your first trip to see it here — begin exploring the map!
        </p>
        <div className="mt-6">
          <button
            onClick={() => { onClose(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:brightness-95 transition-colors"
            data-testid="history-cta"
            title="Start exploring"
          >
            🚀 Start exploring
          </button>
        </div>
      </div>
    </OverlayBase>
  );
}
