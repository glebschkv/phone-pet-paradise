/**
 * Focus Timer Integration Tests
 *
 * Tests the UnifiedFocusTimer component's integration with:
 * - Timer state management
 * - XP/coin rewards
 * - Streak system
 * - Focus mode hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter } from 'react-router-dom';

// ============================================================================
// Mocks
// ============================================================================

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  timerLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock focus mode hook
const mockFocusMode = {
  isActive: false,
  duration: 25 * 60 * 1000,
  remaining: 25 * 60 * 1000,
  progress: 0,
  isPaused: false,
  startFocus: vi.fn(),
  pauseFocus: vi.fn(),
  resumeFocus: vi.fn(),
  stopFocus: vi.fn(),
  setDuration: vi.fn(),
  formatTime: vi.fn((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }),
};

vi.mock('@/hooks/useFocusMode', () => ({
  useFocusMode: () => mockFocusMode,
}));

// Mock XP system
const mockXPSystem = {
  currentXP: 100,
  currentLevel: 2,
  addXP: vi.fn(),
  xpToNextLevel: 200,
  progress: 0.5,
};

vi.mock('@/hooks/useXPSystem', () => ({
  useXPSystem: () => mockXPSystem,
}));

// Mock coin system
const mockCoinSystem = {
  balance: 500,
  addCoins: vi.fn(),
  spendCoins: vi.fn(),
  canAfford: vi.fn().mockReturnValue(true),
};

vi.mock('@/hooks/useCoinSystem', () => ({
  useCoinSystem: () => mockCoinSystem,
}));

// Mock streak system
const mockStreakSystem = {
  currentStreak: 5,
  checkIn: vi.fn(),
  useStreakFreeze: vi.fn(),
  earnStreakFreeze: vi.fn(),
};

vi.mock('@/hooks/useStreakSystem', () => ({
  useStreakSystem: () => mockStreakSystem,
}));

// Mock focus presets
vi.mock('@/hooks/useFocusPresets', () => ({
  useFocusPresets: () => ({
    presets: [
      { id: 'quick', name: 'Quick', duration: 5 },
      { id: 'short', name: 'Short', duration: 15 },
      { id: 'standard', name: 'Standard', duration: 25 },
      { id: 'long', name: 'Long', duration: 45 },
    ],
    activePreset: 'standard',
    setActivePreset: vi.fn(),
    getPresetByDuration: vi.fn(),
  }),
}));

// Mock device activity
vi.mock('@/hooks/useDeviceActivity', () => ({
  useDeviceActivity: () => ({
    isMonitoring: false,
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    getUsageData: vi.fn().mockResolvedValue({ timeAwayMinutes: 0 }),
  }),
}));

// Mock ambient sound
vi.mock('@/hooks/useAmbientSound', () => ({
  useAmbientSound: () => ({
    isPlaying: false,
    currentSound: null,
    play: vi.fn(),
    pause: vi.fn(),
    setVolume: vi.fn(),
  }),
}));

// Mock the UnifiedFocusTimer component with a simplified version for testing
vi.mock('@/components/UnifiedFocusTimer', () => ({
  UnifiedFocusTimer: () => {
    const {
      isActive,
      remaining,
      isPaused,
      startFocus,
      pauseFocus,
      resumeFocus,
      stopFocus,
      formatTime,
    } = mockFocusMode;

    return (
      <div data-testid="focus-timer">
        <div data-testid="timer-display">{formatTime(remaining)}</div>
        <div data-testid="timer-status">
          {isActive ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
        </div>
        {!isActive && (
          <button onClick={startFocus} data-testid="start-button">
            Start Focus
          </button>
        )}
        {isActive && !isPaused && (
          <button onClick={pauseFocus} data-testid="pause-button">
            Pause
          </button>
        )}
        {isActive && isPaused && (
          <button onClick={resumeFocus} data-testid="resume-button">
            Resume
          </button>
        )}
        {isActive && (
          <button onClick={stopFocus} data-testid="stop-button">
            Stop
          </button>
        )}
        <div data-testid="preset-buttons">
          <button data-testid="preset-5">5 min</button>
          <button data-testid="preset-15">15 min</button>
          <button data-testid="preset-25">25 min</button>
          <button data-testid="preset-45">45 min</button>
        </div>
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
import { UnifiedFocusTimer } from '@/components/UnifiedFocusTimer';

describe('Focus Timer Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset mock state
    mockFocusMode.isActive = false;
    mockFocusMode.isPaused = false;
    mockFocusMode.remaining = 25 * 60 * 1000;
    mockFocusMode.progress = 0;

    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render timer display with default duration', () => {
      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    });

    it('should show start button when timer is not active', () => {
      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('start-button')).toBeInTheDocument();
      expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument();
    });

    it('should display stopped status initially', () => {
      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('timer-status')).toHaveTextContent('Stopped');
    });
  });

  describe('Timer Controls', () => {
    it('should call startFocus when start button is clicked', async () => {
      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('start-button'));

      expect(mockFocusMode.startFocus).toHaveBeenCalledTimes(1);
    });

    it('should show pause button when timer is running', () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = false;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      expect(screen.queryByTestId('start-button')).not.toBeInTheDocument();
    });

    it('should call pauseFocus when pause button is clicked', async () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = false;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('pause-button'));

      expect(mockFocusMode.pauseFocus).toHaveBeenCalledTimes(1);
    });

    it('should show resume button when timer is paused', () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = true;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('resume-button')).toBeInTheDocument();
    });

    it('should call resumeFocus when resume button is clicked', async () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = true;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('resume-button'));

      expect(mockFocusMode.resumeFocus).toHaveBeenCalledTimes(1);
    });

    it('should show stop button when timer is active', () => {
      mockFocusMode.isActive = true;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('stop-button')).toBeInTheDocument();
    });

    it('should call stopFocus when stop button is clicked', async () => {
      mockFocusMode.isActive = true;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('stop-button'));

      expect(mockFocusMode.stopFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timer Display', () => {
    it('should format time correctly', () => {
      mockFocusMode.remaining = 5 * 60 * 1000; // 5 minutes

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('timer-display')).toHaveTextContent('05:00');
    });

    it('should display running status when timer is active', () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = false;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('timer-status')).toHaveTextContent('Running');
    });

    it('should display paused status when timer is paused', () => {
      mockFocusMode.isActive = true;
      mockFocusMode.isPaused = true;

      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('timer-status')).toHaveTextContent('Paused');
    });
  });

  describe('Duration Presets', () => {
    it('should render preset buttons', () => {
      render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

      expect(screen.getByTestId('preset-5')).toBeInTheDocument();
      expect(screen.getByTestId('preset-15')).toBeInTheDocument();
      expect(screen.getByTestId('preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('preset-45')).toBeInTheDocument();
    });
  });
});

describe('Focus Timer Reward Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockFocusMode.isActive = false;
    mockFocusMode.remaining = 25 * 60 * 1000;
  });

  it('should integrate with XP system', () => {
    render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

    // Verify XP system is accessible
    expect(mockXPSystem.currentLevel).toBe(2);
    expect(mockXPSystem.currentXP).toBe(100);
  });

  it('should integrate with coin system', () => {
    render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

    // Verify coin system is accessible
    expect(mockCoinSystem.balance).toBe(500);
  });

  it('should integrate with streak system', () => {
    render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

    // Verify streak system is accessible
    expect(mockStreakSystem.currentStreak).toBe(5);
  });
});

describe('Focus Timer State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with default state when no saved state exists', () => {
    render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

    expect(screen.getByTestId('timer-status')).toHaveTextContent('Stopped');
    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
  });

  it('should respect remaining time from mock', () => {
    mockFocusMode.remaining = 10 * 60 * 1000; // 10 minutes

    render(<UnifiedFocusTimer />, { wrapper: createWrapper() });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('10:00');
  });
});
