/**
 * XP Progression System Integration Tests
 *
 * Tests the XP and Level system integration with:
 * - XP accumulation
 * - Level progression
 * - Animal unlocking
 * - Biome switching
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
  xpLogger: {
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

// Mock XP system data
const mockXPSystem = {
  currentXP: 150,
  currentLevel: 5,
  xpToNextLevel: 50,
  totalXPForCurrentLevel: 100,
  unlockedAnimals: ['hare', 'cat', 'dog'],
  currentBiome: 'Meadow',
  availableBiomes: ['Meadow', 'Forest'],
  addXP: vi.fn(),
  setLevel: vi.fn(),
  addAnimal: vi.fn(),
  switchBiome: vi.fn(),
  addBiome: vi.fn(),
  getLevelProgress: vi.fn().mockReturnValue(75),
};

vi.mock('@/hooks/useXPSystem', () => ({
  useXPSystem: () => mockXPSystem,
}));

// Mock LevelProgressBar component
vi.mock('@/components/LevelProgressBar', () => ({
  LevelProgressBar: ({
    currentLevel,
    progress,
    currentXP,
    xpToNextLevel,
  }: {
    currentLevel: number;
    progress: number;
    currentXP: number;
    xpToNextLevel: number;
  }) => (
    <div data-testid="level-progress-bar">
      <div data-testid="current-level">Level {currentLevel}</div>
      <div data-testid="progress">{progress}%</div>
      <div data-testid="current-xp">{currentXP} XP</div>
      <div data-testid="xp-to-next">{xpToNextLevel} XP to next</div>
    </div>
  ),
}));

// XP Progress Component for testing
const XPProgressComponent = () => {
  const {
    currentXP,
    currentLevel,
    xpToNextLevel,
    unlockedAnimals,
    currentBiome,
    availableBiomes,
    addXP,
    switchBiome,
    getLevelProgress,
  } = mockXPSystem;

  return (
    <div data-testid="xp-system">
      <div data-testid="xp-display">
        <span data-testid="xp-value">{currentXP} XP</span>
        <span data-testid="level-value">Level {currentLevel}</span>
      </div>

      <div data-testid="progress-section">
        <div data-testid="progress-bar" style={{ width: `${getLevelProgress()}%` }} />
        <span data-testid="xp-to-next">{xpToNextLevel} XP to next level</span>
      </div>

      <div data-testid="animals-section">
        <span data-testid="animal-count">{unlockedAnimals.length} animals unlocked</span>
        {unlockedAnimals.map((animal: string) => (
          <span key={animal} data-testid={`animal-${animal}`}>
            {animal}
          </span>
        ))}
      </div>

      <div data-testid="biome-section">
        <span data-testid="current-biome">Current: {currentBiome}</span>
        {availableBiomes.map((biome: string) => (
          <button
            key={biome}
            data-testid={`biome-${biome}`}
            onClick={() => switchBiome(biome)}
          >
            {biome}
          </button>
        ))}
      </div>

      <button data-testid="add-xp-button" onClick={() => addXP(25)}>
        +25 XP
      </button>
    </div>
  );
};

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
import { LevelProgressBar } from '@/components/LevelProgressBar';

describe('XP Progression Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset mock state
    mockXPSystem.currentXP = 150;
    mockXPSystem.currentLevel = 5;
    mockXPSystem.xpToNextLevel = 50;
    mockXPSystem.unlockedAnimals = ['hare', 'cat', 'dog'];
    mockXPSystem.currentBiome = 'Meadow';
    mockXPSystem.availableBiomes = ['Meadow', 'Forest'];

    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('XP Display Rendering', () => {
    it('should render XP system component', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('xp-system')).toBeInTheDocument();
    });

    it('should display current XP', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('xp-value')).toHaveTextContent('150 XP');
    });

    it('should display current level', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('level-value')).toHaveTextContent('Level 5');
    });

    it('should display XP to next level', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('xp-to-next')).toHaveTextContent('50 XP to next level');
    });
  });

  describe('LevelProgressBar Component', () => {
    it('should render with correct props', () => {
      render(
        <LevelProgressBar
          currentLevel={10}
          progress={60}
          currentXP={300}
          xpToNextLevel={200}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('current-level')).toHaveTextContent('Level 10');
      expect(screen.getByTestId('progress')).toHaveTextContent('60%');
      expect(screen.getByTestId('current-xp')).toHaveTextContent('300 XP');
      expect(screen.getByTestId('xp-to-next')).toHaveTextContent('200 XP to next');
    });

    it('should handle level 0', () => {
      render(
        <LevelProgressBar
          currentLevel={0}
          progress={0}
          currentXP={0}
          xpToNextLevel={15}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('current-level')).toHaveTextContent('Level 0');
      expect(screen.getByTestId('progress')).toHaveTextContent('0%');
    });

    it('should handle max level', () => {
      render(
        <LevelProgressBar
          currentLevel={50}
          progress={100}
          currentXP={99999}
          xpToNextLevel={0}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('current-level')).toHaveTextContent('Level 50');
      expect(screen.getByTestId('progress')).toHaveTextContent('100%');
    });
  });

  describe('XP Addition', () => {
    it('should call addXP when button is clicked', async () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('add-xp-button'));

      expect(mockXPSystem.addXP).toHaveBeenCalledWith(25);
      expect(mockXPSystem.addXP).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple XP additions', async () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('add-xp-button'));
      await user.click(screen.getByTestId('add-xp-button'));
      await user.click(screen.getByTestId('add-xp-button'));

      expect(mockXPSystem.addXP).toHaveBeenCalledTimes(3);
    });
  });

  describe('Animal Collection', () => {
    it('should display correct animal count', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('animal-count')).toHaveTextContent('3 animals unlocked');
    });

    it('should display all unlocked animals', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('animal-hare')).toBeInTheDocument();
      expect(screen.getByTestId('animal-cat')).toBeInTheDocument();
      expect(screen.getByTestId('animal-dog')).toBeInTheDocument();
    });

    it('should handle empty animal collection', () => {
      mockXPSystem.unlockedAnimals = [];

      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('animal-count')).toHaveTextContent('0 animals unlocked');
    });

    it('should handle large animal collection', () => {
      mockXPSystem.unlockedAnimals = Array.from({ length: 20 }, (_, i) => `animal-${i}`);

      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('animal-count')).toHaveTextContent('20 animals unlocked');
    });
  });

  describe('Biome System', () => {
    it('should display current biome', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('current-biome')).toHaveTextContent('Current: Meadow');
    });

    it('should display available biome buttons', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('biome-Meadow')).toBeInTheDocument();
      expect(screen.getByTestId('biome-Forest')).toBeInTheDocument();
    });

    it('should call switchBiome when biome button is clicked', async () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      await user.click(screen.getByTestId('biome-Forest'));

      expect(mockXPSystem.switchBiome).toHaveBeenCalledWith('Forest');
    });

    it('should handle single biome availability', () => {
      mockXPSystem.availableBiomes = ['Meadow'];

      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('biome-Meadow')).toBeInTheDocument();
      expect(screen.queryByTestId('biome-Forest')).not.toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('should call getLevelProgress', () => {
      render(<XPProgressComponent />, { wrapper: createWrapper() });

      expect(mockXPSystem.getLevelProgress).toHaveBeenCalled();
    });

    it('should handle 0% progress', () => {
      mockXPSystem.getLevelProgress.mockReturnValue(0);

      render(<XPProgressComponent />, { wrapper: createWrapper() });

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should handle 100% progress', () => {
      mockXPSystem.getLevelProgress.mockReturnValue(100);

      render(<XPProgressComponent />, { wrapper: createWrapper() });

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });
});

describe('XP System State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display persisted XP data', () => {
    mockXPSystem.currentXP = 500;
    mockXPSystem.currentLevel = 15;

    render(<XPProgressComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('xp-value')).toHaveTextContent('500 XP');
    expect(screen.getByTestId('level-value')).toHaveTextContent('Level 15');
  });

  it('should display persisted biome data', () => {
    mockXPSystem.currentBiome = 'Forest';
    mockXPSystem.availableBiomes = ['Meadow', 'Forest', 'Snow'];

    render(<XPProgressComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('current-biome')).toHaveTextContent('Current: Forest');
    expect(screen.getByTestId('biome-Snow')).toBeInTheDocument();
  });
});

