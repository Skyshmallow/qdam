// src/features/tutorial/TutorialTooltip.tsx

import { ArrowRight, X } from 'lucide-react';
import './TutorialTooltip.css';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetId: string; // HTML id или data-tutorial-id элемента
  position: 'left' | 'center' | 'right'; // Simplified: left sidebar, center buttons, right sidebar
  highlight?: boolean;
}

interface TutorialTooltipProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onPrev?: () => void;
}

export function TutorialTooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onPrev,
}: TutorialTooltipProps) {
  
  return (
    <div className={`tutorial-container tutorial-container--${step.position}`}>
      {/* Pixel art tooltip with ::after arrow */}
      <div className="tutorial-tooltip">
        {/* Header */}
        <div className="tutorial-tooltip__header">
          <div className="tutorial-tooltip__step">
            {currentStep}/{totalSteps}
          </div>
          <button 
            onClick={onSkip}
            className="tutorial-tooltip__close"
            aria-label="Skip tutorial"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="tutorial-tooltip__content">
          <h3 className="tutorial-tooltip__title">{step.title}</h3>
          <p className="tutorial-tooltip__description">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="tutorial-tooltip__footer">
          {onPrev && currentStep > 1 && (
            <button 
              onClick={onPrev}
              className="tutorial-tooltip__btn tutorial-tooltip__btn--secondary"
            >
              Back
            </button>
          )}
          
          <button 
            onClick={onSkip}
            className="tutorial-tooltip__btn tutorial-tooltip__btn--ghost"
          >
            Skip
          </button>

          <button 
            onClick={onNext}
            className="tutorial-tooltip__btn tutorial-tooltip__btn--primary"
          >
            {currentStep === totalSteps ? 'Done!' : (
              <>
                Next <ArrowRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
