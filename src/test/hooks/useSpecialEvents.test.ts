import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpecialEvents } from '@/hooks/useSpecialEvents';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    SPECIAL_EVENTS: 'nomo_special_events',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock gamification data
const mockActiveEvent = {
  id: 'double-xp-weekend',
  name: 'Double XP Weekend',
  description: 'Earn double XP!',
  emoji: '⚡',
  type: 'double_xp' as const,
  multiplier: 2,
  startDate: '2024-06-01',
  endDate: '2024-12-31',
  backgroundGradient: 'from-purple-600 to-pink-600',
};

const mockUpcomingEvent = {
  id: 'holiday-bonus',
  name: 'Holiday Celebration',
  description: 'Special holiday rewards!',
  emoji: '🎄',
  type: 'bonus_rewards' as const,
  startDate: '2024-12-24',
  endDate: '2024-12-26',
  backgroundGradient: 'from-red-600 to-green-600',
  rewards: { xp: 500, coins: 1000 },
};

vi.mock('@/data/GamificationData', () => ({
  SPECIAL_EVENTS: [
    {
      id: 'double-xp-weekend',
      name: 'Double XP Weekend',
      description: 'Earn double XP!',
      emoji: '⚡',
      type: 'double_xp',
      multiplier: 2,
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      backgroundGradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'coin-rush',
      name: 'Coin Rush',
      description: '2x coins!',
      emoji: '💰',
      type: 'double_coins',
      multiplier: 2,
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      backgroundGradient: 'from-yellow-500 to-orange-500',
    },
    {
      id: 'holiday-bonus',
      name: 'Holiday Celebration',
      description: 'Special holiday rewards!',
      emoji: '🎄',
      type: 'bonus_rewards',
      startDate: '2025-12-24',
      endDate: '2025-12-26',
      backgroundGradient: 'from-red-600 to-green-600',
      rewards: { xp: 500, coins: 1000 },
    },
  ],
  getActiveEvents: vi.fn(() => [
    {
      id: 'double-xp-weekend',
      name: 'Double XP Weekend',
      description: 'Earn double XP!',
      emoji: '⚡',
      type: 'double_xp',
      multiplier: 2,
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      backgroundGradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'coin-rush',
      name: 'Coin Rush',
      description: '2x coins!',
      emoji: '💰',
      type: 'double_coins',
      multiplier: 2,
      startDate: '2024-06-01',
      endDate: '2024-12-31',
      backgroundGradient: 'from-yellow-500 to-orange-500',
    },
  ]),
  getUpcomingEvents: vi.fn(() => []),
}));

import { storage } from '@/lib/storage-keys';
import { getActiveEvents, getUpcomingEvents } from '@/data/GamificationData';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

const mockGetActiveEvents = getActiveEvents as ReturnType<typeof vi.fn>;
const mockGetUpcomingEvents = getUpcomingEvents as ReturnType<typeof vi.fn>;

describe('useSpecialEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.state.claimedEventRewards).toEqual([]);
      expect(result.current.state.viewedEvents).toEqual([]);
      expect(result.current.state.dismissedBanners).toEqual([]);
    });

    it('should load active and upcoming events', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(Array.isArray(result.current.activeEvents)).toBe(true);
      expect(Array.isArray(result.current.upcomingEvents)).toBe(true);
    });

    it('should load saved state from storage', () => {
      mockStorage.get.mockReturnValue({
        claimedEventRewards: ['event-1'],
        viewedEvents: ['event-1', 'event-2'],
        dismissedBanners: ['event-3'],
      });

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.state.claimedEventRewards).toContain('event-1');
      expect(result.current.state.viewedEvents.length).toBe(2);
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(typeof result.current.getCurrentMultipliers).toBe('function');
      expect(typeof result.current.getTimeRemaining).toBe('function');
      expect(typeof result.current.getTimeUntilStart).toBe('function');
      expect(typeof result.current.claimEventReward).toBe('function');
      expect(typeof result.current.markEventViewed).toBe('function');
      expect(typeof result.current.dismissEventBanner).toBe('function');
      expect(typeof result.current.getActiveEventInfo).toBe('function');
      expect(typeof result.current.shouldShowBanner).toBe('function');
      expect(typeof result.current.hasUnclaimedRewards).toBe('function');
      expect(typeof result.current.getPrimaryActiveEvent).toBe('function');
      expect(typeof result.current.isDoubleXPActive).toBe('function');
      expect(typeof result.current.isDoubleCoinsActive).toBe('function');
    });
  });

  describe('getCurrentMultipliers', () => {
    it('should return XP multiplier from active event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const multipliers = result.current.getCurrentMultipliers();

      expect(multipliers.xp).toBe(2);
    });

    it('should return coins multiplier from active event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const multipliers = result.current.getCurrentMultipliers();

      expect(multipliers.coins).toBe(2);
    });

    it('should return 1x when no events active', () => {
      mockGetActiveEvents.mockReturnValue([]);

      const { result } = renderHook(() => useSpecialEvents());

      const multipliers = result.current.getCurrentMultipliers();

      expect(multipliers.xp).toBe(1);
      expect(multipliers.coins).toBe(1);
    });

    it('should return highest multiplier when multiple events active', () => {
      mockGetActiveEvents.mockReturnValue([
        { ...mockActiveEvent, multiplier: 2 },
        { id: 'triple-xp', type: 'double_xp', multiplier: 3 },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      const multipliers = result.current.getCurrentMultipliers();

      expect(multipliers.xp).toBe(3);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return time remaining for active event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const remaining = result.current.getTimeRemaining(mockActiveEvent);

      expect(remaining.isExpired).toBe(false);
      expect(remaining.hours).toBeGreaterThanOrEqual(0);
      expect(remaining.minutes).toBeGreaterThanOrEqual(0);
    });

    it('should return expired for past event', () => {
      const pastEvent = {
        ...mockActiveEvent,
        endDate: '2024-01-01',
      };

      const { result } = renderHook(() => useSpecialEvents());

      const remaining = result.current.getTimeRemaining(pastEvent);

      expect(remaining.isExpired).toBe(true);
      expect(remaining.hours).toBe(0);
      expect(remaining.minutes).toBe(0);
    });
  });

  describe('getTimeUntilStart', () => {
    it('should return 0 for already started event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const timeUntil = result.current.getTimeUntilStart(mockActiveEvent);

      expect(timeUntil.days).toBe(0);
      expect(timeUntil.hours).toBe(0);
    });

    it('should return time until start for future event', () => {
      const futureEvent = {
        ...mockActiveEvent,
        startDate: '2024-06-20', // 5 days from mock date
      };

      const { result } = renderHook(() => useSpecialEvents());

      const timeUntil = result.current.getTimeUntilStart(futureEvent);

      expect(timeUntil.days).toBeGreaterThan(0);
    });
  });

  describe('claimEventReward', () => {
    it('should claim event reward', () => {
      mockGetActiveEvents.mockReturnValue([
        {
          ...mockActiveEvent,
          rewards: { xp: 100, coins: 200 },
        },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      let reward;
      act(() => {
        reward = result.current.claimEventReward('double-xp-weekend');
      });

      expect(reward).toBeTruthy();
      expect(result.current.state.claimedEventRewards).toContain('double-xp-weekend');
    });

    it('should not claim already claimed reward', () => {
      mockStorage.get.mockReturnValue({
        claimedEventRewards: ['double-xp-weekend'],
        viewedEvents: [],
        dismissedBanners: [],
      });

      const { result } = renderHook(() => useSpecialEvents());

      let reward;
      act(() => {
        reward = result.current.claimEventReward('double-xp-weekend');
      });

      expect(reward).toBeNull();
    });

    it('should return null for event without rewards', () => {
      const { result } = renderHook(() => useSpecialEvents());

      let reward;
      act(() => {
        reward = result.current.claimEventReward('double-xp-weekend'); // No rewards property
      });

      expect(reward).toBeNull();
    });

    it('should return null for non-existent event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      let reward;
      act(() => {
        reward = result.current.claimEventReward('non-existent');
      });

      expect(reward).toBeNull();
    });
  });

  describe('markEventViewed', () => {
    it('should mark event as viewed', () => {
      const { result } = renderHook(() => useSpecialEvents());

      act(() => {
        result.current.markEventViewed('double-xp-weekend');
      });

      expect(result.current.state.viewedEvents).toContain('double-xp-weekend');
    });

    it('should not duplicate viewed events', () => {
      const { result } = renderHook(() => useSpecialEvents());

      act(() => {
        result.current.markEventViewed('double-xp-weekend');
        result.current.markEventViewed('double-xp-weekend');
      });

      expect(result.current.state.viewedEvents.filter(e => e === 'double-xp-weekend')).toHaveLength(1);
    });
  });

  describe('dismissEventBanner', () => {
    it('should dismiss event banner', () => {
      const { result } = renderHook(() => useSpecialEvents());

      act(() => {
        result.current.dismissEventBanner('double-xp-weekend');
      });

      expect(result.current.state.dismissedBanners).toContain('double-xp-weekend');
    });

    it('should not duplicate dismissed banners', () => {
      const { result } = renderHook(() => useSpecialEvents());

      act(() => {
        result.current.dismissEventBanner('double-xp-weekend');
        result.current.dismissEventBanner('double-xp-weekend');
      });

      expect(result.current.state.dismissedBanners.filter(e => e === 'double-xp-weekend')).toHaveLength(1);
    });
  });

  describe('getActiveEventInfo', () => {
    it('should return info for all active events', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const eventInfo = result.current.getActiveEventInfo();

      expect(Array.isArray(eventInfo)).toBe(true);
      eventInfo.forEach(info => {
        expect(info.event).toBeTruthy();
        expect(info.timeRemaining).toBeTruthy();
        expect(typeof info.hasReward).toBe('boolean');
        expect(typeof info.rewardClaimed).toBe('boolean');
      });
    });

    it('should indicate claimed rewards', () => {
      mockStorage.get.mockReturnValue({
        claimedEventRewards: ['double-xp-weekend'],
        viewedEvents: [],
        dismissedBanners: [],
      });

      const { result } = renderHook(() => useSpecialEvents());

      const eventInfo = result.current.getActiveEventInfo();
      const xpEvent = eventInfo.find(e => e.event.id === 'double-xp-weekend');

      expect(xpEvent?.rewardClaimed).toBe(true);
    });
  });

  describe('shouldShowBanner', () => {
    it('should return true for non-dismissed event', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.shouldShowBanner('double-xp-weekend')).toBe(true);
    });

    it('should return false for dismissed event', () => {
      mockStorage.get.mockReturnValue({
        claimedEventRewards: [],
        viewedEvents: [],
        dismissedBanners: ['double-xp-weekend'],
      });

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.shouldShowBanner('double-xp-weekend')).toBe(false);
    });
  });

  describe('hasUnclaimedRewards', () => {
    it('should return true when event has unclaimed rewards', () => {
      mockGetActiveEvents.mockReturnValue([
        {
          ...mockActiveEvent,
          rewards: { xp: 100 },
        },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.hasUnclaimedRewards()).toBe(true);
    });

    it('should return false when no unclaimed rewards', () => {
      mockStorage.get.mockReturnValue({
        claimedEventRewards: ['double-xp-weekend'],
        viewedEvents: [],
        dismissedBanners: [],
      });

      mockGetActiveEvents.mockReturnValue([
        {
          ...mockActiveEvent,
          rewards: { xp: 100 },
        },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.hasUnclaimedRewards()).toBe(false);
    });

    it('should return false when events have no rewards', () => {
      mockGetActiveEvents.mockReturnValue([mockActiveEvent]); // No rewards property

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.hasUnclaimedRewards()).toBe(false);
    });
  });

  describe('getPrimaryActiveEvent', () => {
    it('should return multiplier event as primary', () => {
      const { result } = renderHook(() => useSpecialEvents());

      const primary = result.current.getPrimaryActiveEvent();

      expect(primary).toBeTruthy();
      expect(primary?.multiplier).toBeTruthy();
    });

    it('should return null when no active events', () => {
      mockGetActiveEvents.mockReturnValue([]);

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.getPrimaryActiveEvent()).toBeNull();
    });

    it('should prefer unclaimed reward events over no-reward events', () => {
      mockGetActiveEvents.mockReturnValue([
        { id: 'no-reward', type: 'community' },
        { id: 'with-reward', type: 'bonus_rewards', rewards: { xp: 100 } },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      const primary = result.current.getPrimaryActiveEvent();

      expect(primary?.id).toBe('with-reward');
    });
  });

  describe('isDoubleXPActive', () => {
    it('should return true when double XP event is active', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.isDoubleXPActive()).toBe(true);
    });

    it('should return false when no double XP event', () => {
      mockGetActiveEvents.mockReturnValue([
        { id: 'coin-event', type: 'double_coins', multiplier: 2 },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.isDoubleXPActive()).toBe(false);
    });
  });

  describe('isDoubleCoinsActive', () => {
    it('should return true when double coins event is active', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.isDoubleCoinsActive()).toBe(true);
    });

    it('should return false when no double coins event', () => {
      mockGetActiveEvents.mockReturnValue([
        { id: 'xp-event', type: 'double_xp', multiplier: 2 },
      ]);

      const { result } = renderHook(() => useSpecialEvents());

      expect(result.current.isDoubleCoinsActive()).toBe(false);
    });
  });

  describe('allEvents', () => {
    it('should expose all defined events', () => {
      const { result } = renderHook(() => useSpecialEvents());

      expect(Array.isArray(result.current.allEvents)).toBe(true);
      expect(result.current.allEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Event Updates', () => {
    it('should update events periodically', async () => {
      const { result } = renderHook(() => useSpecialEvents());

      // Initial state
      const initialEvents = result.current.activeEvents;

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(60000); // 1 minute
      });

      // Events should still be accessible (may or may not have changed)
      expect(Array.isArray(result.current.activeEvents)).toBe(true);
    });
  });
});
