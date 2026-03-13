import { createContext, useContext } from 'react';

export const OnboardingContext = createContext({
  canReplayDonorTutorial: false,
  isDonorTutorialActive: false,
  startDonorTutorial: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);
