import { createContext, useContext } from 'react';

export const OnboardingContext = createContext({
  canReplayDonorTutorial: false,
  canReplayReceiverTutorial: false,
  isDonorTutorialActive: false,
  isReceiverTutorialActive: false,
  isTutorialActive: false,
  currentTutorialRole: null,
  currentTutorialStepKey: null,
  startDonorTutorial: () => {},
  startReceiverTutorial: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);
