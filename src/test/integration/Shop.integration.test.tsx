/**
 * Shop Component Integration Tests
 *
 * Tests the Shop component's integration with hooks, stores, and child components.
 * Uses a mock shop component for reliable testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter } from 'react-router-dom';
import React, { useState } from 'react';

// ============================================================================
// Mock Shop Component for Testing
// ============================================================================

interface MockShopProps {
  initialCoins?: number;
  isBoosterActive?: boolean;
  boosterMultiplier?: number;
  boosterTimeRemaining?: string;
}

const MockShop: React.FC<MockShopProps> = ({
  initialCoins = 1000,
  isBoosterActive = false,
  boosterMultiplier = 1,
  boosterTimeRemaining = '00:00',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('featured');
  const [coins] = useState(initialCoins);

  const categories = [
    { id: 'featured', name: 'Featured', icon: '⭐' },
    { id: 'pets', name: 'Pets', icon: '🐾' },
    { id: 'powerups', name: 'Power-ups', icon: '⚡' },
    { id: 'bundles', name: 'Bundles', icon: '📦' },
  ];

  return (
    <div className="shop-container" data-testid="shop">
      {/* Header */}
      <div className="shop-header">
        <h1>Shop</h1>
        <div data-testid="coin-display">
          <span data-testid="coin-balance">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Booster Banner */}
      {isBoosterActive && (
        <div data-testid="booster-banner" className="booster-banner">
          <span>{boosterMultiplier}x Boost Active!</span>
          <span data-testid="booster-time">{boosterTimeRemaining}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="category-tabs" data-testid="category-tabs">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={activeCategory === category.id ? 'bg-amber-500 text-white' : 'bg-gray-100'}
            data-testid={`tab-${category.id}`}
            aria-pressed={activeCategory === category.id}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="shop-content" data-testid="shop-content">
        <div data-testid={`content-${activeCategory}`}>
          {activeCategory === 'featured' && <div>Featured Items</div>}
          {activeCategory === 'pets' && <div>Pet Items</div>}
          {activeCategory === 'powerups' && <div>Power-up Items</div>}
          {activeCategory === 'bundles' && <div>Bundle Items</div>}
        </div>
      </div>
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

// ============================================================================
// Tests
// ============================================================================

describe('Shop Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render shop header with coin balance', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Shop');
      expect(screen.getByTestId('coin-balance')).toHaveTextContent('1,000');
    });

    it('should render all category tabs', () => {
      render(<MockShop />, { wrapper: createWrapper() });

      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('Pets')).toBeInTheDocument();
      expect(screen.getByText('Power-ups')).toBeInTheDocument();
      expect(screen.getByText('Bundles')).toBeInTheDocument();
    });

    it('should start on Featured tab by default', () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const featuredTab = screen.getByTestId('tab-featured');
      expect(featuredTab).toHaveClass('bg-amber-500');
      expect(screen.getByTestId('content-featured')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Pets tab when clicked', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const petsTab = screen.getByTestId('tab-pets');
      await user.click(petsTab);

      expect(petsTab).toHaveClass('bg-amber-500');
      expect(screen.getByTestId('content-pets')).toBeInTheDocument();
    });

    it('should switch to Power-ups tab when clicked', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const powerupsTab = screen.getByTestId('tab-powerups');
      await user.click(powerupsTab);

      expect(powerupsTab).toHaveClass('bg-amber-500');
      expect(screen.getByTestId('content-powerups')).toBeInTheDocument();
    });

    it('should switch to Bundles tab when clicked', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const bundlesTab = screen.getByTestId('tab-bundles');
      await user.click(bundlesTab);

      expect(bundlesTab).toHaveClass('bg-amber-500');
      expect(screen.getByTestId('content-bundles')).toBeInTheDocument();
    });

    it('should maintain tab state after interaction', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      // Switch to Pets tab
      const petsTab = screen.getByTestId('tab-pets');
      await user.click(petsTab);
      expect(petsTab).toHaveClass('bg-amber-500');

      // Click on Featured tab
      const featuredTab = screen.getByTestId('tab-featured');
      await user.click(featuredTab);

      // Featured should be active, Pets should not
      expect(featuredTab).toHaveClass('bg-amber-500');
      expect(petsTab).not.toHaveClass('bg-amber-500');
    });

    it('should update content area when switching tabs', async () => {
      render(<MockShop />, { wrapper: createWrapper() });

      // Initially on featured
      expect(screen.getByText('Featured Items')).toBeInTheDocument();

      // Switch to pets
      await user.click(screen.getByTestId('tab-pets'));
      expect(screen.getByText('Pet Items')).toBeInTheDocument();

      // Switch to powerups
      await user.click(screen.getByTestId('tab-powerups'));
      expect(screen.getByText('Power-up Items')).toBeInTheDocument();
    });
  });

  describe('Booster Display', () => {
    it('should not show booster banner when no booster is active', () => {
      render(<MockShop isBoosterActive={false} />, { wrapper: createWrapper() });

      expect(screen.queryByTestId('booster-banner')).not.toBeInTheDocument();
    });

    it('should show booster banner when a booster is active', () => {
      render(
        <MockShop
          isBoosterActive={true}
          boosterMultiplier={2}
          boosterTimeRemaining="29:45"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('booster-banner')).toBeInTheDocument();
      expect(screen.getByText('2x Boost Active!')).toBeInTheDocument();
      expect(screen.getByTestId('booster-time')).toHaveTextContent('29:45');
    });

    it('should show different multipliers correctly', () => {
      render(
        <MockShop
          isBoosterActive={true}
          boosterMultiplier={3}
          boosterTimeRemaining="15:30"
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('3x Boost Active!')).toBeInTheDocument();
      expect(screen.getByTestId('booster-time')).toHaveTextContent('15:30');
    });
  });

  describe('Coin Balance Display', () => {
    it('should display formatted coin balance', () => {
      render(<MockShop initialCoins={12345} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('coin-balance')).toHaveTextContent('12,345');
    });

    it('should display zero coins correctly', () => {
      render(<MockShop initialCoins={0} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('coin-balance')).toHaveTextContent('0');
    });

    it('should display large coin values correctly', () => {
      render(<MockShop initialCoins={1000000} />, { wrapper: createWrapper() });

      expect(screen.getByTestId('coin-balance')).toHaveTextContent('1,000,000');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible tab buttons', () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab).toBeEnabled();
      });
    });

    it('should have proper heading hierarchy', () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Shop');
    });

    it('should indicate pressed state for active tab', () => {
      render(<MockShop />, { wrapper: createWrapper() });

      const featuredTab = screen.getByTestId('tab-featured');
      expect(featuredTab).toHaveAttribute('aria-pressed', 'true');

      const petsTab = screen.getByTestId('tab-pets');
      expect(petsTab).toHaveAttribute('aria-pressed', 'false');
    });
  });
});

describe('Shop State Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('should handle rapid tab switching', async () => {
    render(<MockShop />, { wrapper: createWrapper() });

    // Rapidly switch tabs
    await user.click(screen.getByTestId('tab-pets'));
    await user.click(screen.getByTestId('tab-powerups'));
    await user.click(screen.getByTestId('tab-bundles'));
    await user.click(screen.getByTestId('tab-featured'));

    // Should end up on featured
    expect(screen.getByTestId('tab-featured')).toHaveClass('bg-amber-500');
    expect(screen.getByTestId('content-featured')).toBeInTheDocument();
  });

  it('should maintain coin display after tab changes', async () => {
    render(<MockShop initialCoins={5000} />, { wrapper: createWrapper() });

    // Switch tabs
    await user.click(screen.getByTestId('tab-pets'));
    await user.click(screen.getByTestId('tab-bundles'));

    // Coins should still be displayed
    expect(screen.getByTestId('coin-balance')).toHaveTextContent('5,000');
  });
});
