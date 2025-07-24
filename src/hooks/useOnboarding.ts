import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'pet_paradise_onboarding_completed';

export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(completed === 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};