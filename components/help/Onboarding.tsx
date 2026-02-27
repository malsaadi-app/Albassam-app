'use client';

// Onboarding tour component
import React, { useState, useEffect } from 'react';

export interface OnboardingStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  storageKey?: string;
}

export function Onboarding({
  steps,
  onComplete,
  onSkip,
  storageKey = 'onboarding-completed',
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(storageKey);
    if (completed) return;

    setIsVisible(true);
    updatePosition();
  }, []);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [currentStep, isVisible]);

  const updatePosition = () => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const position = step.position || 'bottom';

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - 120;
        left = rect.left + rect.width / 2 - 150;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + rect.width / 2 - 150;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - 75;
        left = rect.left - 320;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - 75;
        left = rect.right + 20;
        break;
    }

    setCoords({ top, left });

    // Highlight target element
    element.classList.add('onboarding-highlight');
    return () => {
      element.classList.remove('onboarding-highlight');
    };
  };

  const handleNext = () => {
    const step = steps[currentStep];
    
    // Remove highlight from current element
    const element = document.querySelector(step.target);
    if (element) {
      element.classList.remove('onboarding-highlight');
    }

    // Execute action if provided
    if (step.action) {
      step.action.onClick();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const element = document.querySelector(steps[currentStep].target);
      if (element) {
        element.classList.remove('onboarding-highlight');
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    const element = document.querySelector(steps[currentStep].target);
    if (element) {
      element.classList.remove('onboarding-highlight');
    }
    
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    if (onSkip) onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onComplete();
  };

  if (!isVisible || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Tour Card */}
      <div
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 animate-fade-in"
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
        }}
      >
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              خطوة {currentStep + 1} من {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              تخطي
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{step.content}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            السابق
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {step.action?.label || (currentStep === steps.length - 1 ? 'إنهاء' : 'التالي')}
          </button>
        </div>
      </div>
    </>
  );
}

// Quick tips component
interface QuickTipProps {
  tips: string[];
  onClose: () => void;
  storageKey?: string;
}

export function QuickTips({ tips, onClose, storageKey = 'quick-tips-shown' }: QuickTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const shown = localStorage.getItem(storageKey);
    if (!shown) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-lg animate-slide-up">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>

        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
            نصيحة سريعة
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">{tips[currentTip]}</p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {currentTip + 1} / {tips.length}
            </span>
            <button
              onClick={handleNext}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {currentTip === tips.length - 1 ? 'فهمت' : 'التالي'}
            </button>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// CSS Animations (add to globals.css)
export const onboardingStyles = `
/* Onboarding highlight */
.onboarding-highlight {
  position: relative;
  z-index: 45 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

/* Slide up animation */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;
