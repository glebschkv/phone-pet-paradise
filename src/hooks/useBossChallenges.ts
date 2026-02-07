import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { BossChallenge, BOSS_CHALLENGES, getBossChallengesByDifficulty } from '@/data/GamificationData';

export interface BossChallengeProgress {
  challengeId: string;
  currentProgress: number; // minutes or count depending on type
  isActive: boolean;
  startedAt: string | null;
  completedAt: string | null;
  lastAttemptAt: string | null;
}

export interface BossChallengesState {
  challengeProgress: Record<string, BossChallengeProgress>;
  completedChallenges: string[];
  activeChallengeId: string | null;
  weeklyFocusMinutes: number; // Track for weekly challenges
  dailyFocusMinutes: number;
  dailySessions: number;
  lastDayReset: string;
  lastWeekReset: string;
}

const BOSS_CHALLENGE_UPDATE_EVENT = 'petIsland_bossChallengeUpdate';

export const useBossChallenges = () => {
  const [state, setState] = useState<BossChallengesState>({
    challengeProgress: {},
    completedChallenges: [],
    activeChallengeId: null,
    weeklyFocusMinutes: 0,
    dailyFocusMinutes: 0,
    dailySessions: 0,
    lastDayReset: new Date().toDateString(),
    lastWeekReset: getMonday(new Date()).toISOString(),
  });

  // Load saved state
  useEffect(() => {
    const saved = storage.get<BossChallengesState>(STORAGE_KEYS.BOSS_CHALLENGES);
    if (saved) {
      // Check for daily/weekly resets
      const today = new Date().toDateString();
      const monday = getMonday(new Date()).toISOString();

      let needsUpdate = false;
      const updatedState = { ...saved };

      if (saved.lastDayReset !== today) {
        updatedState.dailyFocusMinutes = 0;
        updatedState.dailySessions = 0;
        updatedState.lastDayReset = today;
        needsUpdate = true;
      }

      if (new Date(saved.lastWeekReset) < new Date(monday)) {
        updatedState.weeklyFocusMinutes = 0;
        updatedState.lastWeekReset = monday;
        needsUpdate = true;
      }

      setState(needsUpdate ? updatedState : saved);
      if (needsUpdate) {
        storage.set(STORAGE_KEYS.BOSS_CHALLENGES, updatedState);
      }
    }
  }, []);

  const saveState = useCallback((newState: BossChallengesState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.BOSS_CHALLENGES, newState);
  }, []);

  // Start a boss challenge
  const startChallenge = useCallback((challengeId: string): boolean => {
    const challenge = BOSS_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return false;

    // Check if challenge is on cooldown
    const progress = state.challengeProgress[challengeId];
    if (progress?.lastAttemptAt) {
      const cooldownEnd = new Date(progress.lastAttemptAt).getTime() + challenge.cooldownHours * 60 * 60 * 1000;
      if (Date.now() < cooldownEnd) return false;
    }

    // Can only have one active challenge at a time
    if (state.activeChallengeId) return false;

    const newProgress: BossChallengeProgress = {
      challengeId,
      currentProgress: 0,
      isActive: true,
      startedAt: new Date().toISOString(),
      completedAt: null,
      lastAttemptAt: new Date().toISOString(),
    };

    saveState({
      ...state,
      activeChallengeId: challengeId,
      challengeProgress: {
        ...state.challengeProgress,
        [challengeId]: newProgress,
      },
    });

    // Fire event so the notification system can schedule a reminder
    window.dispatchEvent(new CustomEvent('schedule-boss-challenge-reminder', {
      detail: { name: challenge.name, cooldownHours: challenge.cooldownHours }
    }));

    return true;
  }, [state, saveState]);

  // Record progress from a focus session
  const recordFocusSession = useCallback((minutes: number): {
    challengeCompleted: boolean;
    completedChallenge: BossChallenge | null;
  } => {
    const newState = { ...state };
    newState.dailyFocusMinutes += minutes;
    newState.dailySessions += 1;
    newState.weeklyFocusMinutes += minutes;

    let challengeCompleted = false;
    let completedChallenge: BossChallenge | null = null;

    // Check active challenge
    if (state.activeChallengeId) {
      const challenge = BOSS_CHALLENGES.find(c => c.id === state.activeChallengeId);
      const progress = state.challengeProgress[state.activeChallengeId];

      if (challenge && progress) {
        let newProgress = progress.currentProgress;

        switch (challenge.requirement.type) {
          case 'focus_duration':
            // For duration challenges, the session must be >= requirement
            if (minutes >= challenge.requirement.value) {
              newProgress = challenge.requirement.value;
            }
            break;
          case 'consecutive_sessions':
            newProgress += 1;
            break;
          case 'total_focus_week':
            newProgress = newState.weeklyFocusMinutes;
            break;
          case 'perfect_day':
            newProgress = newState.dailyFocusMinutes;
            break;
        }

        // Check if challenge is completed
        if (newProgress >= challenge.requirement.value) {
          challengeCompleted = true;
          completedChallenge = challenge;

          newState.completedChallenges = [...state.completedChallenges, challenge.id];
          newState.activeChallengeId = null;
          newState.challengeProgress[challenge.id] = {
            ...progress,
            currentProgress: newProgress,
            isActive: false,
            completedAt: new Date().toISOString(),
          };
        } else {
          newState.challengeProgress[challenge.id] = {
            ...progress,
            currentProgress: newProgress,
          };
        }
      }
    }

    saveState(newState);

    if (challengeCompleted) {
      window.dispatchEvent(new CustomEvent('cancel-boss-challenge-reminder'));
      window.dispatchEvent(new CustomEvent(BOSS_CHALLENGE_UPDATE_EVENT, {
        detail: { completed: true, challenge: completedChallenge }
      }));
    }

    return { challengeCompleted, completedChallenge };
  }, [state, saveState]);

  // Abandon active challenge
  const abandonChallenge = useCallback(() => {
    if (!state.activeChallengeId) return;

    const progress = state.challengeProgress[state.activeChallengeId];
    if (progress) {
      saveState({
        ...state,
        activeChallengeId: null,
        challengeProgress: {
          ...state.challengeProgress,
          [state.activeChallengeId]: {
            ...progress,
            isActive: false,
          },
        },
      });
      window.dispatchEvent(new CustomEvent('cancel-boss-challenge-reminder'));
    }
  }, [state, saveState]);

  // Get challenge status
  const getChallengeStatus = useCallback((challengeId: string): {
    isAvailable: boolean;
    isActive: boolean;
    isCompleted: boolean;
    cooldownRemaining: number; // hours
    progress: BossChallengeProgress | null;
  } => {
    const challenge = BOSS_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) {
      return { isAvailable: false, isActive: false, isCompleted: false, cooldownRemaining: 0, progress: null };
    }

    const progress = state.challengeProgress[challengeId] || null;
    const isCompleted = state.completedChallenges.includes(challengeId);
    const isActive = state.activeChallengeId === challengeId;

    let cooldownRemaining = 0;
    if (progress?.lastAttemptAt) {
      const cooldownEnd = new Date(progress.lastAttemptAt).getTime() + challenge.cooldownHours * 60 * 60 * 1000;
      const remaining = cooldownEnd - Date.now();
      if (remaining > 0) {
        cooldownRemaining = Math.ceil(remaining / (60 * 60 * 1000));
      }
    }

    const isAvailable = !isActive && cooldownRemaining === 0 && !state.activeChallengeId;

    return { isAvailable, isActive, isCompleted, cooldownRemaining, progress };
  }, [state]);

  // Get active challenge details
  const getActiveChallenge = useCallback((): {
    challenge: BossChallenge | null;
    progress: BossChallengeProgress | null;
    percentComplete: number;
  } => {
    if (!state.activeChallengeId) {
      return { challenge: null, progress: null, percentComplete: 0 };
    }

    const challenge = BOSS_CHALLENGES.find(c => c.id === state.activeChallengeId);
    const progress = state.challengeProgress[state.activeChallengeId] || null;

    if (!challenge || !progress) {
      return { challenge: null, progress: null, percentComplete: 0 };
    }

    const percentComplete = Math.min(100, (progress.currentProgress / challenge.requirement.value) * 100);

    return { challenge, progress, percentComplete };
  }, [state]);

  // Get all challenges by difficulty
  const getChallengesByDifficulty = useCallback((difficulty: BossChallenge['difficulty']) => {
    return getBossChallengesByDifficulty(difficulty).map(challenge => ({
      challenge,
      status: getChallengeStatus(challenge.id),
    }));
  }, [getChallengeStatus]);

  return {
    state,
    startChallenge,
    recordFocusSession,
    abandonChallenge,
    getChallengeStatus,
    getActiveChallenge,
    getChallengesByDifficulty,
    allChallenges: BOSS_CHALLENGES,
  };
};

// Helper
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
