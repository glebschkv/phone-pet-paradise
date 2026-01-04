import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakDisplay } from '@/components/StreakDisplay';

// Mock the useAppStateTracking hook
const mockGetNextMilestone = vi.fn();
const mockGetStreakEmoji = vi.fn();
let mockStreakData = {
  currentStreak: 5,
  longestStreak: 10,
  totalSessions: 25,
  streakFreezeCount: 3,
};

vi.mock('@/hooks/useAppStateTracking', () => ({
  useAppStateTracking: () => ({
    streakData: mockStreakData,
    getNextMilestone: mockGetNextMilestone,
    getStreakEmoji: mockGetStreakEmoji,
  }),
}));

describe('StreakDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreakData = {
      currentStreak: 5,
      longestStreak: 10,
      totalSessions: 25,
      streakFreezeCount: 3,
    };
    mockGetStreakEmoji.mockReturnValue('🔥');
    mockGetNextMilestone.mockReturnValue({
      milestone: 7,
      title: '1 Week Streak',
      reward: 'streak_7',
    });
  });

  describe('Header', () => {
    it('renders Focus Streak title', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Focus Streak')).toBeInTheDocument();
    });

    it('displays current streak count', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays streak emoji', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('calls getStreakEmoji with current streak', () => {
      render(<StreakDisplay />);
      expect(mockGetStreakEmoji).toHaveBeenCalledWith(5);
    });
  });

  describe('Next Milestone', () => {
    it('displays next milestone title', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('1 Week Streak')).toBeInTheDocument();
    });

    it('displays milestone progress', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('5 / 7 days')).toBeInTheDocument();
    });

    it('displays Next milestone label', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('Next milestone')).toBeInTheDocument();
    });

    it('hides milestone section when no next milestone', () => {
      mockGetNextMilestone.mockReturnValue(null);

      render(<StreakDisplay />);
      expect(screen.queryByText('Next milestone')).not.toBeInTheDocument();
    });
  });

  describe('Stats Grid', () => {
    it('displays longest streak', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Best')).toBeInTheDocument();
    });

    it('displays total sessions', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('displays streak freeze count', () => {
      render(<StreakDisplay />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Freezes')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress percentage correctly', () => {
      mockStreakData.currentStreak = 5;
      mockGetNextMilestone.mockReturnValue({
        milestone: 10,
        title: 'Test Milestone',
      });

      render(<StreakDisplay />);
      // The Progress component should receive value of 50
      expect(screen.getByText('5 / 10 days')).toBeInTheDocument();
    });

    it('shows 100% when at milestone', () => {
      mockStreakData.currentStreak = 7;
      mockGetNextMilestone.mockReturnValue({
        milestone: 7,
        title: 'Current Milestone',
      });

      render(<StreakDisplay />);
      expect(screen.getByText('7 / 7 days')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero streak', () => {
      mockStreakData = {
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        streakFreezeCount: 0,
      };
      mockGetNextMilestone.mockReturnValue({
        milestone: 3,
        title: '3 Day Streak',
      });

      render(<StreakDisplay />);
      expect(screen.getByText('0 / 3 days')).toBeInTheDocument();
    });

    it('handles very large streak numbers', () => {
      mockStreakData = {
        currentStreak: 999,
        longestStreak: 1000,
        totalSessions: 5000,
        streakFreezeCount: 50,
      };
      mockGetNextMilestone.mockReturnValue(null);

      render(<StreakDisplay />);
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });
});
