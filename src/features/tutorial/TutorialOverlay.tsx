// src/features/tutorial/TutorialOverlay.tsx

import { useEffect, useState, useRef } from 'react';
import { TutorialTooltip, type TutorialStep } from './TutorialTooltip';

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onPrev?: () => void;
}

export function TutorialOverlay({
  step,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onPrev,
}: TutorialOverlayProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find target element
    const targetElement = document.querySelector(`[data-tutorial-id="${step.targetId}"]`) as HTMLElement;
    
    if (!targetElement) {
      console.warn(`[Tutorial] Target element not found: ${step.targetId}`);
      return;
    }

    // Add highlight class
    if (step.highlight) {
      targetElement.classList.add('tutorial-highlight');
    }

    // Calculate position based on simplified positions: left, center, right
    const updatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const isMobile = window.innerWidth <= 640;
      const tooltipWidth = isMobile ? 240 : 280;
      const tooltipHeight = isMobile ? 180 : 200; // approximate
      const arrowSize = isMobile ? 8 : 16; // arrow triangle size
      const gap = isMobile ? 4 : 8;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'left':
          // Left sidebar button - tooltip appears to the right of button
          // Arrow points LEFT (towards the button)
          top = targetRect.top + (targetRect.height / 2) - 40; // Align arrow with button center
          left = targetRect.right + arrowSize + gap;
          break;
          
        case 'center':
          // Center button - tooltip appears ABOVE the button
          // Arrow points DOWN (towards the button)
          top = targetRect.top - tooltipHeight - arrowSize - gap;
          left = targetRect.left + (targetRect.width / 2) - 60; // Offset so arrow aligns with button
          break;
          
        case 'right':
          // Right sidebar button - tooltip appears to the left of button  
          // Arrow points RIGHT (towards the button)
          top = targetRect.top + (targetRect.height / 2) - 40; // Align arrow with button center
          left = targetRect.left - tooltipWidth - arrowSize - gap;
          break;
      }

      // Keep within viewport
      const padding = isMobile ? 8 : 16;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

      setTooltipPosition({ top, left });
      setIsVisible(true);
    };

    updatePosition();

    // Update on resize
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      // Remove highlight
      if (step.highlight) {
        targetElement.classList.remove('tutorial-highlight');
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="tutorial-backdrop" onClick={onSkip} />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          zIndex: 10000,
        }}
      >
        <TutorialTooltip
          step={step}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={onNext}
          onSkip={onSkip}
          onPrev={onPrev}
        />
      </div>
    </>
  );
}
