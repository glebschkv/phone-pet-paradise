import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { SpecialEvent, SPECIAL_EVENTS, getActiveEvents, getUpcomingEvents } from '@/data/GamificationData';

export interface SpecialEventsState {
  claimedEventRewards: string[];
  viewedEvents: string[];
  dismissedBanners: string[];
}

export interface ActiveEventInfo {
  event: SpecialEvent;
  timeRemaining: { hours: number; minutes: number };
  hasReward: boolean;
  rewardClaimed: boolean;
}

export const useSpecialEvents = () => {
  const [state, setState] = useState<SpecialEventsState>({
    claimedEventRewards: [],
    viewedEvents: [],
    dismissedBanners: [],
  });

  const [activeEvents, setActiveEvents] = useState<SpecialEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SpecialEvent[]>([]);

  // Load saved state and set up event polling
  useEffect(() => {
    const saved = storage.get<SpecialEventsState>(STORAGE_KEYS.SPECIAL_EVENTS);
    if (saved) {
      setState(saved);
    }

    // Define updateEvents inside useEffect to avoid stale closure issues
    const updateEvents = () => {
      setActiveEvents(getActiveEvents());
      setUpcomingEvents(getUpcomingEvents());
    };

    // Update active/upcoming events
    updateEvents();

    // Check events every minute
    const interval = setInterval(updateEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveState = useCallback((newState: SpecialEventsState) => {
    setState(newState);
    storage.set(STORAGE_KEYS.SPECIAL_EVENTS, newState);
  }, []);

  // Get current multipliers from active events
  const getCurrentMultipliers = useCallback((): { xp: number; coins: number } => {
    let xpMultiplier = 1;
    let coinsMultiplier = 1;

    activeEvents.forEach(event => {
      if (event.type === 'double_xp' && event.multiplier) {
        xpMultiplier = Math.max(xpMultiplier, event.multiplier);
      }
      if (event.type === 'double_coins' && event.multiplier) {
        coinsMultiplier = Math.max(coinsMultiplier, event.multiplier);
      }
      if (event.type === 'bonus_rewards' && event.multiplier) {
        xpMultiplier = Math.max(xpMultiplier, event.multiplier);
        coinsMultiplier = Math.max(coinsMultiplier, event.multiplier);
      }
    });

    return { xp: xpMultiplier, coins: coinsMultiplier };
  }, [activeEvents]);

  // Get time remaining for an event
  const getTimeRemaining = useCallback((event: SpecialEvent): { hours: number; minutes: number; isExpired: boolean } => {
    const endDate = new Date(event.endDate);
    const now = new Date();

    if (now > endDate) {
      return { hours: 0, minutes: 0, isExpired: true };
    }

    const diff = endDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, isExpired: false };
  }, []);

  // Get time until event starts
  const getTimeUntilStart = useCallback((event: SpecialEvent): { days: number; hours: number } => {
    const startDate = new Date(event.startDate);
    const now = new Date();

    if (now >= startDate) {
      return { days: 0, hours: 0 };
    }

    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours };
  }, []);

  // Claim event reward
  const claimEventReward = useCallback((eventId: string): SpecialEvent['rewards'] | null => {
    const event = [...activeEvents, ...SPECIAL_EVENTS].find(e => e.id === eventId);
    if (!event || !event.rewards) return null;

    if (state.claimedEventRewards.includes(eventId)) return null;

    saveState({
      ...state,
      claimedEventRewards: [...state.claimedEventRewards, eventId],
    });

    return event.rewards;
  }, [state, activeEvents, saveState]);

  // Mark event as viewed
  const markEventViewed = useCallback((eventId: string) => {
    if (!state.viewedEvents.includes(eventId)) {
      saveState({
        ...state,
        viewedEvents: [...state.viewedEvents, eventId],
      });
    }
  }, [state, saveState]);

  // Dismiss event banner
  const dismissEventBanner = useCallback((eventId: string) => {
    if (!state.dismissedBanners.includes(eventId)) {
      saveState({
        ...state,
        dismissedBanners: [...state.dismissedBanners, eventId],
      });
    }
  }, [state, saveState]);

  // Get active event info for display
  const getActiveEventInfo = useCallback((): ActiveEventInfo[] => {
    return activeEvents.map(event => ({
      event,
      timeRemaining: getTimeRemaining(event),
      hasReward: !!event.rewards,
      rewardClaimed: state.claimedEventRewards.includes(event.id),
    }));
  }, [activeEvents, state.claimedEventRewards, getTimeRemaining]);

  // Check if event banner should show
  const shouldShowBanner = useCallback((eventId: string): boolean => {
    return !state.dismissedBanners.includes(eventId);
  }, [state.dismissedBanners]);

  // Check if there are any active events with unclaimed rewards
  const hasUnclaimedRewards = useCallback((): boolean => {
    return activeEvents.some(event =>
      event.rewards && !state.claimedEventRewards.includes(event.id)
    );
  }, [activeEvents, state.claimedEventRewards]);

  // Get primary active event (for banner display)
  const getPrimaryActiveEvent = useCallback((): SpecialEvent | null => {
    // Prioritize events with multipliers, then events with rewards
    const multiplierEvent = activeEvents.find(e => e.multiplier);
    if (multiplierEvent) return multiplierEvent;

    const rewardEvent = activeEvents.find(e => e.rewards && !state.claimedEventRewards.includes(e.id));
    if (rewardEvent) return rewardEvent;

    return activeEvents[0] || null;
  }, [activeEvents, state.claimedEventRewards]);

  // Check if any double XP event is active
  const isDoubleXPActive = useCallback((): boolean => {
    return activeEvents.some(e => e.type === 'double_xp');
  }, [activeEvents]);

  // Check if any double coins event is active
  const isDoubleCoinsActive = useCallback((): boolean => {
    return activeEvents.some(e => e.type === 'double_coins');
  }, [activeEvents]);

  return {
    state,
    activeEvents,
    upcomingEvents,
    getCurrentMultipliers,
    getTimeRemaining,
    getTimeUntilStart,
    claimEventReward,
    markEventViewed,
    dismissEventBanner,
    getActiveEventInfo,
    shouldShowBanner,
    hasUnclaimedRewards,
    getPrimaryActiveEvent,
    isDoubleXPActive,
    isDoubleCoinsActive,
    allEvents: SPECIAL_EVENTS,
  };
};
