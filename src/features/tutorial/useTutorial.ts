// src/features/tutorial/useTutorial.ts

import { useState, useEffect, useCallback } from 'react';
import type { TutorialStep } from './TutorialTooltip';

const TUTORIAL_STORAGE_KEY = 'qdam_tutorial_completed';

interface UseTutorialReturn {
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  startTutorial: () => void;
  resetTutorial: () => void;
}

interface UseTutorialOptions {
  isAppReady?: boolean;
}

export function useTutorial(steps: TutorialStep[], options?: UseTutorialOptions): UseTutorialReturn {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { isAppReady = true } = options || {};

  // Check if tutorial was completed before
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!completed && isAppReady) {
      // Auto-start tutorial for new users after app is ready
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Tutorial completed
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      setIsActive(false);
      setCurrentStep(1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setIsActive(false);
    setCurrentStep(1);
  }, []);

  const startTutorial = useCallback(() => {
    setCurrentStep(1);
    setIsActive(true);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setCurrentStep(1);
    setIsActive(true);
  }, []);

  const currentStepData = isActive && steps[currentStep - 1] 
    ? steps[currentStep - 1] 
    : null;

  return {
    isActive,
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    nextStep,
    prevStep,
    skipTutorial,
    startTutorial,
    resetTutorial,
  };
}
