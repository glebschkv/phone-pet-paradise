import { useState, useCallback, useEffect } from 'react';
import { AppReview } from '@/plugins/app-review';
import { appReviewLogger } from '@/lib/logger';

const REVIEW_STORAGE_KEY = 'nomo_app_review';

interface ReviewState {
  hasPrompted: boolean;
  lastPromptDate: string | null;
  focusSessionsCompleted: number;
  appOpensCount: number;
  neverAskAgain: boolean;
}

const defaultState: ReviewState = {
  hasPrompted: false,
  lastPromptDate: null,
  focusSessionsCompleted: 0,
  appOpensCount: 0,
  neverAskAgain: false,
};

// Criteria for showing review prompt:
// - At least 5 completed focus sessions
// - At least 3 app opens
// - Haven't prompted in the last 30 days
// - User hasn't selected "never ask again"
const MIN_FOCUS_SESSIONS = 5;
const MIN_APP_OPENS = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 30;

export const useAppReview = () => {
  const [state, setState] = useState<ReviewState>(defaultState);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Load state from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REVIEW_STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch {
      // Invalid data, use default
    }

    // Increment app opens
    incrementAppOpens();
  }, []);

  // Save state to storage
  const saveState = useCallback((newState: ReviewState) => {
    setState(newState);
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(newState));
  }, []);

  // Increment app opens count
  const incrementAppOpens = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, appOpensCount: prev.appOpensCount + 1 };
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Record a completed focus session
  const recordFocusSession = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, focusSessionsCompleted: prev.focusSessionsCompleted + 1 };
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Check if we should show the review prompt
  const shouldShowReviewPrompt = useCallback((): boolean => {
    if (state.neverAskAgain) return false;

    // Check minimum criteria
    if (state.focusSessionsCompleted < MIN_FOCUS_SESSIONS) return false;
    if (state.appOpensCount < MIN_APP_OPENS) return false;

    // Check if we've prompted recently
    if (state.lastPromptDate) {
      const lastPrompt = new Date(state.lastPromptDate);
      const daysSincePrompt = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;
    }

    return true;
  }, [state]);

  // Try to show the review prompt (call after successful focus session)
  const tryShowReviewPrompt = useCallback(() => {
    if (shouldShowReviewPrompt()) {
      setShowReviewDialog(true);
      return true;
    }
    return false;
  }, [shouldShowReviewPrompt]);

  // Request review via native API
  const requestReview = useCallback(async () => {
    try {
      appReviewLogger.debug('[AppReview] Requesting native review prompt');
      const result = await AppReview.requestReview();
      appReviewLogger.debug('[AppReview] Result:', result);
    } catch (error) {
      appReviewLogger.error('[AppReview] Failed to request review:', error);
    }

    // Record that we prompted
    saveState({
      ...state,
      hasPrompted: true,
      lastPromptDate: new Date().toISOString(),
    });

    setShowReviewDialog(false);
  }, [state, saveState]);

  // User chose "Later"
  const dismissReview = useCallback(() => {
    saveState({
      ...state,
      lastPromptDate: new Date().toISOString(),
    });
    setShowReviewDialog(false);
  }, [state, saveState]);

  // User chose "Never ask again"
  const neverAskAgain = useCallback(() => {
    saveState({
      ...state,
      neverAskAgain: true,
    });
    setShowReviewDialog(false);
  }, [state, saveState]);

  return {
    showReviewDialog,
    setShowReviewDialog,
    focusSessionsCompleted: state.focusSessionsCompleted,
    recordFocusSession,
    tryShowReviewPrompt,
    requestReview,
    dismissReview,
    neverAskAgain,
    shouldShowReviewPrompt,
  };
};
