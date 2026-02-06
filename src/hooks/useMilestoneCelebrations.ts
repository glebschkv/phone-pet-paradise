import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { Milestone, MILESTONES, getMilestoneForValue, getNextMilestone } from '@/data/GamificationData';

export interface MilestoneState {
  achievedMilestones: string[];
  claimedMilestones: string[];
  pendingCelebration: Milestone | null;
}

export interface MilestoneProgress {
  type: Milestone['type'];
  currentValue: number;
  nextMilestone: Milestone | null;
  progressPercent: number;
}

const MILESTONE_EVENT = 'petIsland_milestoneAchieved';

export const useMilestoneCelebrations = () => {
  const [state, setState] = useState<MilestoneState>({
    achievedMilestones: [],
    claimedMilestones: [],
    pendingCelebration: null,
  });

  const [showCelebration, setShowCelebration] = useState(false);

  // Load saved state — but never auto-show stale celebrations from a previous session.
  // If the user closed the app without dismissing, clear the pending state so the
  // black overlay doesn't appear on every subsequent app load.
  useEffect(() => {
    const saved = storage.get<MilestoneState>(STORAGE_KEYS.MILESTONES);
    if (saved) {
      if (saved.pendingCelebration) {
        const cleared: MilestoneState = {
          ...saved,
          claimedMilestones: [...saved.claimedMilestones, saved.pendingCelebration.id],
          pendingCelebration: null,
        };
        setState(cleared);
        storage.set(STORAGE_KEYS.MILESTONES, cleared);
      } else {
        setState(saved);
      }
    }
  }, []);

  const saveState = useCallback((newState: MilestoneState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.MILESTONES, newState);
  }, []);

  // Check for new milestone achievement
  const checkMilestone = useCallback((type: Milestone['type'], value: number): Milestone | null => {
    const milestone = getMilestoneForValue(type, value);

    if (milestone && !state.achievedMilestones.includes(milestone.id)) {
      const newState: MilestoneState = {
        ...state,
        achievedMilestones: [...state.achievedMilestones, milestone.id],
        pendingCelebration: milestone,
      };

      saveState(newState);
      setShowCelebration(true);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent(MILESTONE_EVENT, {
        detail: { milestone }
      }));

      return milestone;
    }

    return null;
  }, [state, saveState]);

  // Multiple milestone types check at once
  const checkAllMilestones = useCallback((values: Partial<Record<Milestone['type'], number>>): Milestone[] => {
    const achievedMilestones: Milestone[] = [];

    Object.entries(values).forEach(([type, value]) => {
      if (value !== undefined) {
        const milestone = checkMilestone(type as Milestone['type'], value);
        if (milestone) {
          achievedMilestones.push(milestone);
        }
      }
    });

    return achievedMilestones;
  }, [checkMilestone]);

  // Dismiss celebration and claim rewards
  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);

    if (state.pendingCelebration) {
      saveState({
        ...state,
        claimedMilestones: [...state.claimedMilestones, state.pendingCelebration.id],
        pendingCelebration: null,
      });
    }
  }, [state, saveState]);

  // Get milestone progress for a type
  const getMilestoneProgress = useCallback((type: Milestone['type'], currentValue: number): MilestoneProgress => {
    const nextMilestone = getNextMilestone(type, currentValue);

    if (!nextMilestone) {
      return {
        type,
        currentValue,
        nextMilestone: null,
        progressPercent: 100,
      };
    }

    // Find the previous milestone threshold
    const typeMilestones = MILESTONES.filter(m => m.type === type).sort((a, b) => a.threshold - b.threshold);
    const prevMilestoneIndex = typeMilestones.findIndex(m => m.id === nextMilestone.id) - 1;
    const prevThreshold = prevMilestoneIndex >= 0 ? typeMilestones[prevMilestoneIndex].threshold : 0;

    const progressInRange = currentValue - prevThreshold;
    const rangeTotal = nextMilestone.threshold - prevThreshold;
    const progressPercent = Math.min(100, (progressInRange / rangeTotal) * 100);

    return {
      type,
      currentValue,
      nextMilestone,
      progressPercent,
    };
  }, []);

  // Get all progress for dashboard
  const getAllProgress = useCallback((values: Partial<Record<Milestone['type'], number>>): MilestoneProgress[] => {
    return Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([type, value]) => getMilestoneProgress(type as Milestone['type'], value!));
  }, [getMilestoneProgress]);

  // Get achieved milestones with details
  const getAchievedMilestones = useCallback((): Milestone[] => {
    return MILESTONES.filter(m => state.achievedMilestones.includes(m.id));
  }, [state.achievedMilestones]);

  // Get unclaimed rewards
  const getUnclaimedRewards = useCallback((): Milestone[] => {
    return MILESTONES.filter(m =>
      state.achievedMilestones.includes(m.id) &&
      !state.claimedMilestones.includes(m.id)
    );
  }, [state]);

  // Check if milestone is achieved
  const isMilestoneAchieved = useCallback((milestoneId: string): boolean => {
    return state.achievedMilestones.includes(milestoneId);
  }, [state.achievedMilestones]);

  // Get celebration type for animations
  const getCelebrationType = useCallback((): Milestone['celebrationType'] | null => {
    return state.pendingCelebration?.celebrationType || null;
  }, [state.pendingCelebration]);

  return {
    state,
    showCelebration,
    pendingCelebration: state.pendingCelebration,
    checkMilestone,
    checkAllMilestones,
    dismissCelebration,
    getMilestoneProgress,
    getAllProgress,
    getAchievedMilestones,
    getUnclaimedRewards,
    isMilestoneAchieved,
    getCelebrationType,
    allMilestones: MILESTONES,
  };
};

// Export event name for other components to listen
export const MILESTONE_ACHIEVED_EVENT = MILESTONE_EVENT;
