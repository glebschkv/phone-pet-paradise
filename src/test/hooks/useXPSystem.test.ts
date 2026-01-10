import { describe, it, expect } from 'vitest';
import { XP_CONFIG, TIMER_DURATIONS, getLevelFromXP, getXPForLevel } from '@/lib/constants';
import { calculateSessionXP } from '@/types/xp-system';

describe('XP System Utilities', () => {
  describe('calculateSessionXP', () => {
    it('should calculate base XP correctly', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 0,
        shieldAttempts: 0,
        hasAppsConfigured: false,
      });

      expect(result.baseXP).toBe(25 * XP_CONFIG.BASE_XP_PER_MINUTE);
      expect(result.totalXP).toBe(result.baseXP);
    });

    it('should apply streak bonus correctly', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 7,
        shieldAttempts: 0,
        hasAppsConfigured: false,
      });

      const expectedStreakMultiplier = 1 + 7 * XP_CONFIG.MULTIPLIERS.STREAK_BONUS_PER_DAY;
      expect(result.appliedMultipliers.streak).toBe(expectedStreakMultiplier);
      expect(result.streakBonus).toBeGreaterThan(0);
    });

    it('should cap streak multiplier at maximum', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 100,
        shieldAttempts: 0,
        hasAppsConfigured: false,
      });

      expect(result.appliedMultipliers.streak).toBeLessThanOrEqual(
        XP_CONFIG.MULTIPLIERS.MAX_STREAK_MULTIPLIER
      );
    });

    it('should apply perfect focus bonus when no shield attempts', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 0,
        shieldAttempts: 0,
        hasAppsConfigured: true,
      });

      expect(result.appliedMultipliers.focus).toBe(1.25);
      expect(result.focusBonus).toBeGreaterThan(0);
    });

    it('should apply good focus bonus for 1-2 shield attempts', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 0,
        shieldAttempts: 2,
        hasAppsConfigured: true,
      });

      expect(result.appliedMultipliers.focus).toBe(1.10);
    });

    it('should not apply focus bonus for 3+ shield attempts', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 0,
        shieldAttempts: 3,
        hasAppsConfigured: true,
      });

      expect(result.appliedMultipliers.focus).toBe(1);
      expect(result.focusBonus).toBe(0);
    });

    it('should apply event multiplier correctly', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 0,
        shieldAttempts: 0,
        hasAppsConfigured: false,
        activeEventMultiplier: 2.0,
      });

      expect(result.appliedMultipliers.event).toBe(2.0);
      expect(result.eventBonus).toBeGreaterThan(0);
    });

    it('should combine all multipliers correctly', () => {
      const result = calculateSessionXP({
        sessionMinutes: 25,
        streakDays: 7,
        shieldAttempts: 0,
        hasAppsConfigured: true,
        activeEventMultiplier: 2.0,
      });

      const expectedTotal =
        result.appliedMultipliers.streak *
        result.appliedMultipliers.focus *
        result.appliedMultipliers.event;

      expect(result.appliedMultipliers.total).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1);
    });

    it('should return correct level for XP within thresholds', () => {
      // Thresholds: 0 (L1), 30 (L2), 70 (L3), 120 (L4), 180 (L5), 260 (L6), 350 (L7), 460 (L8), 590 (L9)...
      expect(getLevelFromXP(100)).toBe(3);  // >= 70, < 120
      expect(getLevelFromXP(250)).toBe(5);  // >= 180, < 260
      expect(getLevelFromXP(500)).toBe(8);  // >= 460, < 590
    });

    it('should handle XP beyond threshold table', () => {
      const beyondThreshold = XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] + 5000;
      const level = getLevelFromXP(beyondThreshold);
      expect(level).toBeGreaterThan(XP_CONFIG.LEVEL_THRESHOLDS.length);
    });

    it('should cap at max level', () => {
      const veryHighXP = 1000000;
      expect(getLevelFromXP(veryHighXP)).toBeLessThanOrEqual(XP_CONFIG.MAX_LEVEL);
    });
  });

  describe('getXPForLevel', () => {
    it('should return 0 for level 0 or below', () => {
      expect(getXPForLevel(0)).toBe(0);
      expect(getXPForLevel(-1)).toBe(0);
    });

    it('should return correct XP for levels within threshold table', () => {
      expect(getXPForLevel(1)).toBe(XP_CONFIG.LEVEL_THRESHOLDS[0]);
      expect(getXPForLevel(2)).toBe(XP_CONFIG.LEVEL_THRESHOLDS[1]);
    });

    it('should calculate XP correctly for levels beyond table', () => {
      const level = XP_CONFIG.LEVEL_THRESHOLDS.length + 5;
      const expectedXP =
        XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] +
        5 * XP_CONFIG.XP_PER_LEVEL_AFTER_20;
      expect(getXPForLevel(level)).toBe(expectedXP);
    });
  });
});

describe('Timer Durations', () => {
  it('should have correct minimum session for XP', () => {
    expect(TIMER_DURATIONS.MIN_SESSION_FOR_XP).toBe(25);
  });

  it('should have valid focus duration options', () => {
    expect(TIMER_DURATIONS.FOCUS_OPTIONS).toContain(25);
    expect(TIMER_DURATIONS.FOCUS_OPTIONS).toContain(30);
    expect(TIMER_DURATIONS.FOCUS_OPTIONS).toContain(45);
    expect(TIMER_DURATIONS.FOCUS_OPTIONS).toContain(60);
  });

  it('should have break durations defined', () => {
    expect(TIMER_DURATIONS.SHORT_BREAK).toBe(5);
    expect(TIMER_DURATIONS.LONG_BREAK).toBe(15);
  });
});
