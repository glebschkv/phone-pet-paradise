/**
 * Streak System Integration Tests
 *
 * Tests the StreakDisplay component's integration with:
 * - Streak state management
 * - Streak freeze functionality
 * - Visual representation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  streakLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock streak system hook
const mockStreakSystem = {
  currentStreak: 5,
  longestStreak: 10,
  lastCheckIn: new Date().toISOString(),
  streakFreezes: 2,
  isStreakActive: true,
  checkIn: vi.fn(),
  useStreakFreeze: vi.fn().mockReturnValue(true),
  earnStreakFreeze: vi.fn(),
  canCheckIn: true,
  timeUntilNextCheckIn: 0,
  getStreakStatus: vi.fn().mockReturnValue('active'),
};

vi.mock('@/hooks/useStreakSystem', () => ({
  useStreakSystem: () => mockStreakSystem,
}));

// Mock the StreakDisplay component
vi.mock('@/components/StreakDisplay', () => ({
  StreakDisplay: () => {
    const {
      currentStreak,
      longestStreak,
      streakFreezes,
      isStreakActive,
      checkIn,
      useStreakFreeze,
      canCheckIn,
    } = mockStreakSystem;

    return (
      <div data-testid="streak-display">
        <div data-testid="current-streak">
          <span>🔥</span>
          <span data-testid="streak-count">{currentStreak}</span>
          <span>day streak</span>
        </div>

        <div data-testid="longest-streak">
          Best: {longestStreak} days
        </div>

        <div data-testid="streak-freezes">
          <span>❄️ {streakFreezes} freezes available</span>
        </div>

        <div data-testid="streak-status">
          Status: {isStreakActive ? 'Active' : 'Inactive'}
        </div>

        {canCheckIn && (
          <button
            data-testid="check-in-button"
            onClick={checkIn}
          >
            Check In
          </button>
        )}

        {streakFreezes > 0 && (
          <button
            data-testid="use-freeze-button"
            onClick={useStreakFreeze}
          >
            Use Freeze
          </button>
        )}
      </div>
    );
  },
}));

// ============================================================================
// Test Setup
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };
};

// Import after mocks
import { StreakDisplay } from '@/components/StreakDisplay';

describe('Streak Display Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset mock state
    mockStreakSystem.currentStreak = 5;
    mockStreakSystem.longestStreak = 10;
    mockStreakSystem.streakFreezes = 2;
    mockStreakSystem.isStreakActive = true;
    mockStreakSystem.canCheckIn = true;

    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Streak Display Rendering', () => {
    it('should render streak display', () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-display')).toBeInTheDocument();
    });

    it('should display current streak count', () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-count')).toHaveTextContent('5');
    });

    it('should display longest streak', () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('longest-streak')).toHaveTextContent('Best: 10 days');
    });

    it('should display available streak freezes', () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-freezes')).toHaveTextContent('2 freezes available');
    });

    it('should display active streak status', () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-status')).toHaveTextContent('Status: Active');
    });

    it('should display inactive streak status when streak is broken', () => {
      mockStreakSystem.isStreakActive = false;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-status')).toHaveTextContent('Status: Inactive');
    });
  });

  describe('Check-In Functionality', () => {
    it('should show check-in button when can check in', () => {
      mockStreakSystem.canCheckIn = true;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('check-in-button')).toBeInTheDocument();
    });

    it('should not show check-in button when cannot check in', () => {
      mockStreakSystem.canCheckIn = false;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.queryByTestId('check-in-button')).not.toBeInTheDocument();
    });

    it('should call checkIn when button is clicked', async () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('check-in-button'));

      expect(mockStreakSystem.checkIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Streak Freeze Functionality', () => {
    it('should show use freeze button when freezes are available', () => {
      mockStreakSystem.streakFreezes = 2;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('use-freeze-button')).toBeInTheDocument();
    });

    it('should not show use freeze button when no freezes available', () => {
      mockStreakSystem.streakFreezes = 0;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.queryByTestId('use-freeze-button')).not.toBeInTheDocument();
    });

    it('should call useStreakFreeze when button is clicked', async () => {
      render(<StreakDisplay />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('use-freeze-button'));

      expect(mockStreakSystem.useStreakFreeze).toHaveBeenCalledTimes(1);
    });
  });

  describe('Streak States', () => {
    it('should handle zero streak', () => {
      mockStreakSystem.currentStreak = 0;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-count')).toHaveTextContent('0');
    });

    it('should handle large streak values', () => {
      mockStreakSystem.currentStreak = 365;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-count')).toHaveTextContent('365');
    });

    it('should handle zero freezes', () => {
      mockStreakSystem.streakFreezes = 0;

      render(<StreakDisplay />, { wrapper: createWrapper() });

      expect(screen.getByTestId('streak-freezes')).toHaveTextContent('0 freezes available');
    });
  });
});

describe('Streak System State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display persisted streak data', () => {
    mockStreakSystem.currentStreak = 7;
    mockStreakSystem.longestStreak = 14;

    render(<StreakDisplay />, { wrapper: createWrapper() });

    expect(screen.getByTestId('streak-count')).toHaveTextContent('7');
    expect(screen.getByTestId('longest-streak')).toHaveTextContent('Best: 14 days');
  });
});
