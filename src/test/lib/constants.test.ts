import { describe, it, expect } from 'vitest';
import {
  APP_CONFIG,
  TIMER_DURATIONS,
  XP_CONFIG,
  FOCUS_BONUS,
  COIN_CONFIG,
  STREAK_CONFIG,
  getXPForLevel,
  getLevelFromXP,
  getFocusBonusInfo,
  getStreakMultiplier,
} from '@/lib/constants';

describe('APP_CONFIG', () => {
  it('should have valid app configuration', () => {
    expect(APP_CONFIG.APP_NAME).toBe('NoMo Phone');
    expect(APP_CONFIG.APP_VERSION).toBe('1.0.0');
    expect(APP_CONFIG.STORAGE_PREFIX).toBe('nomo_');
    expect(APP_CONFIG.APP_GROUP_IDENTIFIER).toBe('group.co.nomoinc.nomo');
  });
});

describe('TIMER_DURATIONS', () => {
  it('should have valid focus options', () => {
    expect(TIMER_DURATIONS.FOCUS_OPTIONS).toEqual([25, 30, 45, 60, 90, 120, 180]);
  });

  it('should have valid break durations', () => {
    expect(TIMER_DURATIONS.SHORT_BREAK).toBe(5);
    expect(TIMER_DURATIONS.LONG_BREAK).toBe(15);
  });

  it('should have minimum XP session at 25 minutes', () => {
    expect(TIMER_DURATIONS.MIN_SESSION_FOR_XP).toBe(25);
  });

  it('should have 4 sessions before long break', () => {
    expect(TIMER_DURATIONS.SESSIONS_BEFORE_LONG_BREAK).toBe(4);
  });
});

describe('XP_CONFIG', () => {
  it('should have valid base XP rate', () => {
    expect(XP_CONFIG.BASE_XP_PER_MINUTE).toBe(1.2);
  });

  it('should have level thresholds in ascending order', () => {
    for (let i = 1; i < XP_CONFIG.LEVEL_THRESHOLDS.length; i++) {
      expect(XP_CONFIG.LEVEL_THRESHOLDS[i]).toBeGreaterThan(
        XP_CONFIG.LEVEL_THRESHOLDS[i - 1]
      );
    }
  });

  it('should have max level at 50', () => {
    expect(XP_CONFIG.MAX_LEVEL).toBe(50);
  });

  it('should have valid streak multiplier limits', () => {
    expect(XP_CONFIG.MULTIPLIERS.STREAK_BONUS_PER_DAY).toBe(0.03);
    expect(XP_CONFIG.MULTIPLIERS.MAX_STREAK_MULTIPLIER).toBe(1.6);
  });
});

describe('FOCUS_BONUS', () => {
  it('should have correct perfect focus multiplier', () => {
    expect(FOCUS_BONUS.PERFECT_FOCUS.multiplier).toBe(1.25);
    expect(FOCUS_BONUS.PERFECT_FOCUS.coinBonus).toBe(50);
  });

  it('should have correct good focus multiplier', () => {
    expect(FOCUS_BONUS.GOOD_FOCUS.multiplier).toBe(1.10);
    expect(FOCUS_BONUS.GOOD_FOCUS.coinBonus).toBe(25);
  });

  it('should have no bonus for distracted', () => {
    expect(FOCUS_BONUS.DISTRACTED.multiplier).toBe(1.0);
    expect(FOCUS_BONUS.DISTRACTED.coinBonus).toBe(0);
  });

  it('should allow 2 attempts for good focus', () => {
    expect(FOCUS_BONUS.GOOD_FOCUS_MAX_ATTEMPTS).toBe(2);
  });
});

describe('COIN_CONFIG', () => {
  it('should have valid base coins per minute', () => {
    expect(COIN_CONFIG.BASE_COINS_PER_MINUTE).toBe(2);
  });

  it('should have valid reward amounts', () => {
    expect(COIN_CONFIG.REWARDS.DAILY_LOGIN).toBe(20);
    expect(COIN_CONFIG.REWARDS.ACHIEVEMENT_UNLOCK).toBe(50);
    expect(COIN_CONFIG.REWARDS.QUEST_COMPLETE).toBe(75);
  });

  it('should have price ranges in ascending order', () => {
    const ranges = Object.values(COIN_CONFIG.PRICE_RANGES);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].min).toBeGreaterThanOrEqual(ranges[i - 1].max);
    }
  });
});

describe('STREAK_CONFIG', () => {
  it('should have max 3 streak freezes', () => {
    expect(STREAK_CONFIG.MAX_STREAK_FREEZES).toBe(3);
  });

  it('should have streak freeze cost of 100', () => {
    expect(STREAK_CONFIG.STREAK_FREEZE_COST).toBe(100);
  });

  it('should have valid milestones', () => {
    expect(STREAK_CONFIG.MILESTONES).toContain(7);
    expect(STREAK_CONFIG.MILESTONES).toContain(30);
    expect(STREAK_CONFIG.MILESTONES).toContain(365);
  });

  it('should have increasing milestone bonuses', () => {
    const bonuses = Object.values(STREAK_CONFIG.MILESTONE_BONUS_XP);
    for (let i = 1; i < bonuses.length; i++) {
      expect(bonuses[i]).toBeGreaterThan(bonuses[i - 1]);
    }
  });
});

describe('Helper Functions', () => {
  describe('getXPForLevel', () => {
    it('should return 0 for level 0', () => {
      expect(getXPForLevel(0)).toBe(0);
    });

    it('should return correct XP for level 1', () => {
      expect(getXPForLevel(1)).toBe(XP_CONFIG.LEVEL_THRESHOLDS[0]);
    });

    it('should handle levels beyond threshold table', () => {
      const level = 25;
      const result = getXPForLevel(level);
      expect(result).toBeGreaterThan(XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1]);
    });
  });

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1);
    });

    it('should return correct levels for threshold values', () => {
      // Thresholds: 0 (L1), 30 (L2), 70 (L3), 120 (L4), 180 (L5), 260 (L6)...
      expect(getLevelFromXP(100)).toBe(3);  // >= 70, < 120
      expect(getLevelFromXP(250)).toBe(5);  // >= 180, < 260
    });

    it('should cap at max level', () => {
      expect(getLevelFromXP(1000000)).toBeLessThanOrEqual(XP_CONFIG.MAX_LEVEL);
    });
  });

  describe('getFocusBonusInfo', () => {
    it('should return perfect focus for 0 attempts with apps configured', () => {
      const result = getFocusBonusInfo(0, true);
      expect(result.multiplier).toBe(1.25);
      expect(result.label).toBe('PERFECT FOCUS');
    });

    it('should return good focus for 1-2 attempts', () => {
      expect(getFocusBonusInfo(1, true).multiplier).toBe(1.10);
      expect(getFocusBonusInfo(2, true).multiplier).toBe(1.10);
    });

    it('should return distracted for 3+ attempts', () => {
      expect(getFocusBonusInfo(3, true).multiplier).toBe(1.0);
      expect(getFocusBonusInfo(10, true).multiplier).toBe(1.0);
    });

    it('should return distracted when apps not configured', () => {
      expect(getFocusBonusInfo(0, false).multiplier).toBe(1.0);
    });
  });

  describe('getStreakMultiplier', () => {
    it('should return base multiplier for 0 streak days', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
    });

    it('should increase multiplier with streak days', () => {
      // STREAK_BONUS_PER_DAY is 0.03, so 7 days = 1 + (7 * 0.03) = 1.21
      expect(getStreakMultiplier(7)).toBeCloseTo(1.21, 2);
    });

    it('should cap at max multiplier', () => {
      expect(getStreakMultiplier(100)).toBe(XP_CONFIG.MULTIPLIERS.MAX_STREAK_MULTIPLIER);
    });
  });
});
