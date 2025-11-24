import { OverlayBase } from './OverlayBase';

interface HistoryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryOverlay({ isOpen, onClose }: HistoryOverlayProps) {
  return (
    <OverlayBase 
      title="Journey History" 
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
      </div>
    </OverlayBase>
  );
}
