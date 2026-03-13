import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';
import { OnboardingContext } from '../../contexts/OnboardingContext';
import { donorTutorialSteps } from './donorTutorialSteps';
import './OnboardingTour.css';

const HIGHLIGHT_PADDING = 10;
const TOOLTIP_GAP = 16;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTooltipPosition = (rect, placement) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!rect || placement === 'center') {
    return { top: viewportHeight / 2, left: viewportWidth / 2, centered: true };
  }

  const tooltipWidth = Math.min(360, viewportWidth - 32);
  const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;

  const positions = {
    bottom: {
      top: rect.bottom + TOOLTIP_GAP,
      left: clamp(centeredLeft, 16, viewportWidth - tooltipWidth - 16),
    },
    top: {
      top: rect.top - TOOLTIP_GAP,
      left: clamp(centeredLeft, 16, viewportWidth - tooltipWidth - 16),
    },
    right: {
      top: clamp(rect.top, 16, viewportHeight - 220),
      left: Math.min(
        rect.right + TOOLTIP_GAP,
        viewportWidth - tooltipWidth - 16
      ),
    },
    left: {
      top: clamp(rect.top, 16, viewportHeight - 220),
      left: Math.max(rect.left - tooltipWidth - TOOLTIP_GAP, 16),
    },
  };

  const fallbackBottom = positions.bottom;
  const selected = positions[placement] || fallbackBottom;
  const top = clamp(selected.top, 16, viewportHeight - 220);

  return { top, left: selected.left, centered: false };
};

function OnboardingOverlay({
  active,
  step,
  stepIndex,
  totalSteps,
  targetRect,
  canGoBack,
  isSaving,
  error,
  onNext,
  onBack,
  onSkip,
}) {
  if (!active || !step) {
    return null;
  }

  const tooltipPosition = getTooltipPosition(targetRect, step.placement);

  return (
    <div className="onboarding-tour" aria-live="polite">
      <div className="onboarding-tour__backdrop" />

      {targetRect && (
        <div
          className="onboarding-tour__highlight"
          style={{
            top: targetRect.top - HIGHLIGHT_PADDING,
            left: targetRect.left - HIGHLIGHT_PADDING,
            width: targetRect.width + HIGHLIGHT_PADDING * 2,
            height: targetRect.height + HIGHLIGHT_PADDING * 2,
          }}
        >
          <div className="onboarding-tour__pulse" />
        </div>
      )}

      <section
        className={`onboarding-tour__tooltip ${tooltipPosition.centered ? 'is-centered' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        style={
          tooltipPosition.centered
            ? undefined
            : { top: tooltipPosition.top, left: tooltipPosition.left }
        }
      >
        <p className="onboarding-tour__eyebrow">Donor tutorial</p>
        <h2 className="onboarding-tour__title">{step.title}</h2>
        <p className="onboarding-tour__text">{step.text}</p>

        {error && <div className="onboarding-tour__error">{error}</div>}

        <div className="onboarding-tour__footer">
          <div className="onboarding-tour__progress">
            Step {stepIndex + 1} of {totalSteps}
          </div>
          <div className="onboarding-tour__actions">
            <button
              type="button"
              className="onboarding-tour__button onboarding-tour__button--link"
              onClick={onSkip}
              disabled={isSaving}
            >
              Skip
            </button>
            <button
              type="button"
              className="onboarding-tour__button onboarding-tour__button--ghost"
              onClick={onBack}
              disabled={!canGoBack || isSaving}
            >
              Back
            </button>
            <button
              type="button"
              className="onboarding-tour__button onboarding-tour__button--primary"
              onClick={onNext}
              disabled={isSaving}
            >
              {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DonorOnboardingController({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mode, setMode] = useState('auto');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [targetRect, setTargetRect] = useState(null);
  const syncFrameRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const steps = donorTutorialSteps;

  const currentStep = active ? steps[stepIndex] : null;

  const clearSync = useCallback(() => {
    if (syncFrameRef.current) {
      window.cancelAnimationFrame(syncFrameRef.current);
      syncFrameRef.current = null;
    }
    if (syncTimeoutRef.current) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (role !== 'DONOR') {
      setProfileLoaded(true);
      setOnboardingCompleted(true);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await profileAPI.get();
        if (cancelled) {
          return;
        }
        const completed = Boolean(response.data?.onboardingCompleted);
        setOnboardingCompleted(completed);
        setProfileLoaded(true);
        if (!completed) {
          setMode('auto');
          setStepIndex(0);
          setActive(true);
        }
      } catch (loadError) {
        console.error('Failed to load onboarding state:', loadError);
        if (!cancelled) {
          setProfileLoaded(true);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => () => clearSync(), [clearSync]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !currentStep) {
      return;
    }

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [active, currentStep, location.pathname, navigate]);

  const syncTargetRect = useCallback(() => {
    clearSync();

    if (!active || !currentStep?.selector) {
      setTargetRect(null);
      return;
    }

    const startedAt = Date.now();

    const updateRect = () => {
      const element = document.querySelector(currentStep.selector);

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        return;
      }

      if (Date.now() - startedAt > 2200) {
        setTargetRect(null);
        return;
      }

      syncFrameRef.current = window.requestAnimationFrame(updateRect);
    };

    syncTimeoutRef.current = window.setTimeout(updateRect, 80);
  }, [active, clearSync, currentStep]);

  useLayoutEffect(() => {
    syncTargetRect();
  }, [syncTargetRect]);

  useEffect(() => {
    if (!active || !currentStep?.selector) {
      return undefined;
    }

    const handleViewportChange = () => {
      const element = document.querySelector(currentStep.selector);
      if (!element) {
        return;
      }
      setTargetRect(element.getBoundingClientRect());
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [active, currentStep]);

  const closeTutorial = useCallback(() => {
    clearSync();
    setActive(false);
    setStepIndex(0);
    setTargetRect(null);
    setError('');
    setIsSaving(false);
  }, [clearSync]);

  const persistCompletion = useCallback(async () => {
    setIsSaving(true);
    setError('');

    try {
      await profileAPI.updateOnboarding({ onboardingCompleted: true });
      setOnboardingCompleted(true);
      closeTutorial();
    } catch (saveError) {
      console.error('Failed to persist onboarding state:', saveError);
      setIsSaving(false);
      setError('We could not save your tutorial progress. Please try again.');
    }
  }, [closeTutorial]);

  const handleNext = useCallback(() => {
    if (stepIndex === steps.length - 1) {
      if (mode === 'replay') {
        closeTutorial();
        return;
      }
      persistCompletion();
      return;
    }
    setError('');
    setStepIndex(current => current + 1);
  }, [closeTutorial, mode, persistCompletion, stepIndex, steps.length]);

  const handleBack = useCallback(() => {
    setError('');
    setStepIndex(current => Math.max(current - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    if (mode === 'replay') {
      closeTutorial();
      return;
    }
    persistCompletion();
  }, [closeTutorial, mode, persistCompletion]);

  const startDonorTutorial = useCallback(() => {
    if (role !== 'DONOR' || !profileLoaded) {
      return;
    }
    setMode('replay');
    setStepIndex(0);
    setError('');
    setActive(true);
  }, [profileLoaded, role]);

  const contextValue = useMemo(
    () => ({
      canReplayDonorTutorial: role === 'DONOR' && profileLoaded,
      isDonorTutorialActive: active,
      onboardingCompleted,
      startDonorTutorial,
    }),
    [active, onboardingCompleted, profileLoaded, role, startDonorTutorial]
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      <OnboardingOverlay
        active={active}
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        targetRect={targetRect}
        canGoBack={stepIndex > 0}
        isSaving={isSaving}
        error={error}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
      />
    </OnboardingContext.Provider>
  );
}
