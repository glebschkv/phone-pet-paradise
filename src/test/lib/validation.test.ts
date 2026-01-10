import { describe, it, expect } from 'vitest';
import {
  isValidNumber,
  isNonNegativeInteger,
  isPositiveNumber,
  clampNumber,
  isNonEmptyString,
  validateTimerDuration,
  validateTimerMinutes,
  validateXPAmount,
  validateLevel,
  validateSessionMinutes,
  validateCoinAmount,
  validateCoinTransaction,
  validateMultiplier,
  validateRating,
  validateTimerState,
  validateCoinState,
  TIMER_VALIDATION,
  XP_VALIDATION,
  COIN_VALIDATION,
} from '@/lib/validation';

describe('validation utilities', () => {
  describe('isValidNumber', () => {
    it('should return true for valid finite numbers', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(42)).toBe(true);
      expect(isValidNumber(-17)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
      expect(isValidNumber(0.001)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isValidNumber(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isValidNumber('42')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber({})).toBe(false);
      expect(isValidNumber([])).toBe(false);
      expect(isValidNumber(true)).toBe(false);
    });
  });

  describe('isNonNegativeInteger', () => {
    it('should return true for non-negative integers', () => {
      expect(isNonNegativeInteger(0)).toBe(true);
      expect(isNonNegativeInteger(1)).toBe(true);
      expect(isNonNegativeInteger(100)).toBe(true);
      expect(isNonNegativeInteger(999999)).toBe(true);
    });

    it('should return false for negative integers', () => {
      expect(isNonNegativeInteger(-1)).toBe(false);
      expect(isNonNegativeInteger(-100)).toBe(false);
    });

    it('should return false for non-integers', () => {
      expect(isNonNegativeInteger(3.14)).toBe(false);
      expect(isNonNegativeInteger(0.5)).toBe(false);
      expect(isNonNegativeInteger(-0.1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNonNegativeInteger('5')).toBe(false);
      expect(isNonNegativeInteger(null)).toBe(false);
      expect(isNonNegativeInteger(undefined)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.001)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
      expect(isPositiveNumber(3.14)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('10')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
    });
  });

  describe('clampNumber', () => {
    it('should return value when within range', () => {
      expect(clampNumber(50, 0, 100)).toBe(50);
      expect(clampNumber(0, 0, 100)).toBe(0);
      expect(clampNumber(100, 0, 100)).toBe(100);
    });

    it('should clamp to minimum when below', () => {
      expect(clampNumber(-10, 0, 100)).toBe(0);
      expect(clampNumber(-1, 5, 10)).toBe(5);
    });

    it('should clamp to maximum when above', () => {
      expect(clampNumber(150, 0, 100)).toBe(100);
      expect(clampNumber(1000, 5, 10)).toBe(10);
    });

    it('should return min for invalid values', () => {
      expect(clampNumber(NaN, 0, 100)).toBe(0);
      expect(clampNumber(Infinity, 0, 100)).toBe(0);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString('   text   ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('should return false for whitespace-only strings', () => {
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(42)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('VALIDATION CONSTANTS', () => {
    it('should have correct TIMER_VALIDATION values', () => {
      expect(TIMER_VALIDATION.MIN_DURATION_SECONDS).toBe(60);
      expect(TIMER_VALIDATION.MAX_DURATION_SECONDS).toBe(28800);
      expect(TIMER_VALIDATION.MIN_DURATION_MINUTES).toBe(1);
      expect(TIMER_VALIDATION.MAX_DURATION_MINUTES).toBe(480);
    });

    it('should have correct XP_VALIDATION values', () => {
      expect(XP_VALIDATION.MIN_XP).toBe(0);
      expect(XP_VALIDATION.MAX_XP).toBe(1000000);
      expect(XP_VALIDATION.MIN_LEVEL).toBe(0);
      expect(XP_VALIDATION.MAX_LEVEL).toBe(50);
    });

    it('should have correct COIN_VALIDATION values', () => {
      expect(COIN_VALIDATION.MIN_BALANCE).toBe(0);
      expect(COIN_VALIDATION.MAX_BALANCE).toBe(10000000);
      expect(COIN_VALIDATION.MIN_TRANSACTION).toBe(1);
      expect(COIN_VALIDATION.MAX_TRANSACTION).toBe(1000000);
    });
  });

  describe('validateTimerDuration', () => {
    it('should return valid duration within range', () => {
      expect(validateTimerDuration(300)).toBe(300);
      expect(validateTimerDuration(1500)).toBe(1500);
    });

    it('should clamp to max for very large values', () => {
      expect(validateTimerDuration(50000)).toBe(TIMER_VALIDATION.MAX_DURATION_SECONDS);
    });

    it('should return min for invalid input', () => {
      expect(validateTimerDuration(-100)).toBe(TIMER_VALIDATION.MIN_DURATION_SECONDS);
      expect(validateTimerDuration('invalid')).toBe(TIMER_VALIDATION.MIN_DURATION_SECONDS);
      expect(validateTimerDuration(null)).toBe(TIMER_VALIDATION.MIN_DURATION_SECONDS);
    });

    it('should return 0 for zero input', () => {
      expect(validateTimerDuration(0)).toBe(0);
    });
  });

  describe('validateTimerMinutes', () => {
    it('should return valid minutes within range', () => {
      expect(validateTimerMinutes(25)).toBe(25);
      expect(validateTimerMinutes(60)).toBe(60);
    });

    it('should clamp to min for values below minimum', () => {
      expect(validateTimerMinutes(0)).toBe(TIMER_VALIDATION.MIN_DURATION_MINUTES);
    });

    it('should clamp to max for values above maximum', () => {
      expect(validateTimerMinutes(1000)).toBe(TIMER_VALIDATION.MAX_DURATION_MINUTES);
    });

    it('should return min for invalid input', () => {
      expect(validateTimerMinutes(-10)).toBe(TIMER_VALIDATION.MIN_DURATION_MINUTES);
      expect(validateTimerMinutes('invalid')).toBe(TIMER_VALIDATION.MIN_DURATION_MINUTES);
    });
  });

  describe('validateXPAmount', () => {
    it('should return valid XP within range', () => {
      expect(validateXPAmount(100)).toBe(100);
      expect(validateXPAmount(5000)).toBe(5000);
    });

    it('should return 0 for invalid input', () => {
      expect(validateXPAmount(-50)).toBe(0);
      expect(validateXPAmount('invalid')).toBe(0);
      expect(validateXPAmount(null)).toBe(0);
    });

    it('should clamp to max for very large values', () => {
      expect(validateXPAmount(9999999)).toBe(XP_VALIDATION.MAX_XP);
    });

    it('should return 0 for zero', () => {
      expect(validateXPAmount(0)).toBe(0);
    });
  });

  describe('validateLevel', () => {
    it('should return valid level within range', () => {
      expect(validateLevel(1)).toBe(1);
      expect(validateLevel(25)).toBe(25);
      expect(validateLevel(50)).toBe(50);
    });

    it('should clamp to max for levels above maximum', () => {
      expect(validateLevel(100)).toBe(XP_VALIDATION.MAX_LEVEL);
    });

    it('should return 0 for invalid input', () => {
      expect(validateLevel(-5)).toBe(0);
      expect(validateLevel('invalid')).toBe(0);
    });

    it('should return 0 for zero', () => {
      expect(validateLevel(0)).toBe(0);
    });
  });

  describe('validateSessionMinutes', () => {
    it('should return valid session minutes', () => {
      expect(validateSessionMinutes(25)).toBe(25);
      expect(validateSessionMinutes(60)).toBe(60);
    });

    it('should return 0 for non-positive values', () => {
      expect(validateSessionMinutes(0)).toBe(0);
      expect(validateSessionMinutes(-10)).toBe(0);
    });

    it('should clamp to max for very large values', () => {
      expect(validateSessionMinutes(1000)).toBe(XP_VALIDATION.MAX_SESSION_MINUTES);
    });

    it('should handle decimal values', () => {
      expect(validateSessionMinutes(25.5)).toBe(25.5);
    });
  });

  describe('validateCoinAmount', () => {
    it('should return valid coin amount', () => {
      expect(validateCoinAmount(100)).toBe(100);
      expect(validateCoinAmount(5000)).toBe(5000);
    });

    it('should return 0 for invalid input', () => {
      expect(validateCoinAmount(-100)).toBe(0);
      expect(validateCoinAmount('invalid')).toBe(0);
    });

    it('should clamp to max for very large values', () => {
      expect(validateCoinAmount(999999999)).toBe(COIN_VALIDATION.MAX_BALANCE);
    });
  });

  describe('validateCoinTransaction', () => {
    it('should return valid transaction amount', () => {
      expect(validateCoinTransaction(50)).toBe(50);
      expect(validateCoinTransaction(100)).toBe(100);
    });

    it('should return 0 for non-positive values', () => {
      expect(validateCoinTransaction(0)).toBe(0);
      expect(validateCoinTransaction(-50)).toBe(0);
    });

    it('should clamp to max for very large values', () => {
      expect(validateCoinTransaction(9999999)).toBe(COIN_VALIDATION.MAX_TRANSACTION);
    });
  });

  describe('validateMultiplier', () => {
    it('should return valid multiplier', () => {
      expect(validateMultiplier(1)).toBe(1);
      expect(validateMultiplier(2)).toBe(2);
      expect(validateMultiplier(1.5)).toBe(1.5);
    });

    it('should return 1 for non-positive values', () => {
      expect(validateMultiplier(0)).toBe(1);
      expect(validateMultiplier(-1)).toBe(1);
    });

    it('should clamp to min (0.1)', () => {
      expect(validateMultiplier(0.01)).toBe(0.1);
    });

    it('should clamp to max (10)', () => {
      expect(validateMultiplier(100)).toBe(10);
    });
  });

  describe('validateRating', () => {
    it('should return valid rating (1-5)', () => {
      expect(validateRating(1)).toBe(1);
      expect(validateRating(3)).toBe(3);
      expect(validateRating(5)).toBe(5);
    });

    it('should clamp to 1 for values below 1', () => {
      expect(validateRating(0)).toBe(1);
      expect(validateRating(-1)).toBe(1);
    });

    it('should clamp to 5 for values above 5', () => {
      expect(validateRating(10)).toBe(5);
    });

    it('should return 1 for invalid input', () => {
      expect(validateRating('invalid')).toBe(1);
      expect(validateRating(null)).toBe(1);
    });
  });

  describe('validateTimerState', () => {
    const defaults = {
      timeLeft: 1500,
      sessionDuration: 1500,
      sessionType: 'work' as const,
      isRunning: false,
      startTime: null,
      soundEnabled: true,
      completedSessions: 0,
    };

    it('should return defaults for invalid input', () => {
      expect(validateTimerState(null, defaults)).toEqual(defaults);
      expect(validateTimerState(undefined, defaults)).toEqual(defaults);
      expect(validateTimerState('invalid', defaults)).toEqual(defaults);
    });

    it('should validate and return correct values', () => {
      const input = {
        timeLeft: 900,
        sessionDuration: 1500,
        sessionType: 'work',
        isRunning: true,
        startTime: 1704067200000,
        soundEnabled: false,
        completedSessions: 5,
      };

      const result = validateTimerState(input, defaults);

      expect(result.timeLeft).toBe(900);
      expect(result.sessionDuration).toBe(1500);
      expect(result.sessionType).toBe('work');
      expect(result.isRunning).toBe(true);
      expect(result.startTime).toBe(1704067200000);
      expect(result.soundEnabled).toBe(false);
      expect(result.completedSessions).toBe(5);
    });

    it('should handle break session type', () => {
      const result = validateTimerState({ sessionType: 'break' }, defaults);
      expect(result.sessionType).toBe('break');
    });

    it('should default invalid sessionType to work', () => {
      const result = validateTimerState({ sessionType: 'invalid' }, defaults);
      expect(result.sessionType).toBe('work');
    });

    it('should cap timeLeft to sessionDuration', () => {
      const result = validateTimerState(
        { timeLeft: 3000, sessionDuration: 1500 },
        defaults
      );
      expect(result.timeLeft).toBeLessThanOrEqual(result.sessionDuration);
    });

    it('should handle optional category and taskLabel', () => {
      const result = validateTimerState(
        { category: 'Study', taskLabel: 'Math homework' },
        defaults
      );
      expect(result.category).toBe('Study');
      expect(result.taskLabel).toBe('Math homework');
    });

    it('should set optional fields to undefined if not strings', () => {
      const result = validateTimerState(
        { category: 123, taskLabel: null },
        defaults
      );
      expect(result.category).toBeUndefined();
      expect(result.taskLabel).toBeUndefined();
    });
  });

  describe('validateCoinState', () => {
    it('should return defaults for invalid input', () => {
      const result = validateCoinState(null);
      expect(result).toEqual({ balance: 0, totalEarned: 0, totalSpent: 0 });
    });

    it('should validate and return correct values', () => {
      const input = {
        balance: 1000,
        totalEarned: 2500,
        totalSpent: 1500,
      };

      const result = validateCoinState(input);

      expect(result.balance).toBe(1000);
      expect(result.totalEarned).toBe(2500);
      expect(result.totalSpent).toBe(1500);
    });

    it('should return 0 for invalid balance values', () => {
      const result = validateCoinState({
        balance: -100,
        totalEarned: 'invalid',
        totalSpent: null,
      });

      expect(result.balance).toBe(0);
      expect(result.totalEarned).toBe(0);
      expect(result.totalSpent).toBe(0);
    });

    it('should clamp values to max', () => {
      const result = validateCoinState({
        balance: 999999999,
        totalEarned: 999999999,
        totalSpent: 999999999,
      });

      expect(result.balance).toBe(COIN_VALIDATION.MAX_BALANCE);
      expect(result.totalEarned).toBe(COIN_VALIDATION.MAX_BALANCE);
      expect(result.totalSpent).toBe(COIN_VALIDATION.MAX_BALANCE);
    });
  });
});
