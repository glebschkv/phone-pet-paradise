import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';

export interface OnboardingStep {
  id: string;
  completed: boolean;
  completedAt?: string;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  completedAt: string | null;
  steps: OnboardingStep[];
  currentStepIndex: number;
  skippedOnboarding: boolean;
}

interface OnboardingStore extends OnboardingState {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  skipOnboarding: () => void;
  completeStep: (stepId: string) => void;
  setCurrentStep: (index: number) => void;
  isStepCompleted: (stepId: string) => boolean;
}

const initialState: OnboardingState = {
  hasCompletedOnboarding: false, completedAt: null, steps: [], currentStepIndex: 0, skippedOnboarding: false,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      completeOnboarding: () => set({ hasCompletedOnboarding: true, completedAt: new Date().toISOString() }),
      resetOnboarding: () => set(initialState),
      skipOnboarding: () => set({ hasCompletedOnboarding: true, skippedOnboarding: true, completedAt: new Date().toISOString() }),
      completeStep: (stepId) => {
        const { steps } = get();
        const existing = steps.find(s => s.id === stepId);
        if (existing) {
          set({ steps: steps.map(s => s.id === stepId ? { ...s, completed: true, completedAt: new Date().toISOString() } : s) });
        } else {
          set({ steps: [...steps, { id: stepId, completed: true, completedAt: new Date().toISOString() }] });
        }
      },
      setCurrentStep: (index) => set({ currentStepIndex: index }),
      isStepCompleted: (stepId) => get().steps.some(s => s.id === stepId && s.completed),
    }),
    {
      name: 'nomo_onboarding',
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            if (localStorage.getItem('pet_paradise_onboarding_completed') === 'true') {
              return { ...initialState, hasCompletedOnboarding: true, completedAt: new Date().toISOString() };
            }
          } catch { /* ignore */ }
        }
        if (state) logger.debug('Onboarding store rehydrated');
      },
    }
  )
);

export const useHasCompletedOnboarding = () => useOnboardingStore((s) => s.hasCompletedOnboarding);
export const useOnboardingSteps = () => useOnboardingStore((s) => s.steps);
export const useCurrentStepIndex = () => useOnboardingStore((s) => s.currentStepIndex);
