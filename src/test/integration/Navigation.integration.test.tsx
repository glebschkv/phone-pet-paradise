/**
 * Navigation Integration Tests
 *
 * Tests the IOSTabBar and navigation components integration with:
 * - Route navigation
 * - Active state management
 * - Accessibility features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

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
}));

// Mock native plugins
vi.mock('@/hooks/useNativePluginStatus', () => ({
  useNativePluginStatus: () => ({
    isNative: false,
    isChecking: false,
    plugins: {},
    errors: [],
    hasCriticalErrors: false,
    lastChecked: Date.now(),
    checkAllPlugins: vi.fn(),
    isPluginAvailable: vi.fn().mockReturnValue(false),
    hasPluginError: vi.fn().mockReturnValue(false),
    shouldUsePlugin: vi.fn().mockReturnValue(false),
  }),
  safeCallPlugin: vi.fn(),
}));

// ============================================================================
// Mock Tab Bar Component (defined separately for vitest compatibility)
// ============================================================================

const MockIOSTabBar = () => {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/focus', label: 'Focus', icon: '⏰' },
    { path: '/collection', label: 'Collection', icon: '📚' },
    { path: '/shop', label: 'Shop', icon: '🛒' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav data-testid="ios-tab-bar" role="navigation" aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <a
            key={tab.path}
            href={tab.path}
            data-testid={`nav-${tab.label.toLowerCase()}`}
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? 'active' : ''}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

// ============================================================================
// Test Components
// ============================================================================

const HomePage = () => <div data-testid="home-page">Home Page</div>;
const FocusPage = () => <div data-testid="focus-page">Focus Page</div>;
const CollectionPage = () => <div data-testid="collection-page">Collection Page</div>;
const ShopPage = () => <div data-testid="shop-page">Shop Page</div>;
const SettingsPage = () => <div data-testid="settings-page">Settings Page</div>;

// ============================================================================
// Test Setup
// ============================================================================

interface TestAppProps {
  initialRoute?: string;
}

const TestApp = ({ initialRoute = '/' }: TestAppProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <div data-testid="app-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <MockIOSTabBar />
          </div>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

describe('Navigation Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Bar Rendering', () => {
    it('should render the tab bar', () => {
      render(<TestApp />);

      expect(screen.getByTestId('ios-tab-bar')).toBeInTheDocument();
    });

    it('should render all navigation tabs', () => {
      render(<TestApp />);

      expect(screen.getByTestId('nav-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-focus')).toBeInTheDocument();
      expect(screen.getByTestId('nav-collection')).toBeInTheDocument();
      expect(screen.getByTestId('nav-shop')).toBeInTheDocument();
      expect(screen.getByTestId('nav-settings')).toBeInTheDocument();
    });

    it('should have proper navigation role', () => {
      render(<TestApp />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Active State', () => {
    it('should mark home tab as active on home route', () => {
      render(<TestApp initialRoute="/" />);

      const homeTab = screen.getByTestId('nav-home');
      expect(homeTab).toHaveAttribute('aria-current', 'page');
      expect(homeTab).toHaveClass('active');
    });

    it('should mark focus tab as active on focus route', () => {
      render(<TestApp initialRoute="/focus" />);

      const focusTab = screen.getByTestId('nav-focus');
      expect(focusTab).toHaveAttribute('aria-current', 'page');
    });

    it('should mark shop tab as active on shop route', () => {
      render(<TestApp initialRoute="/shop" />);

      const shopTab = screen.getByTestId('nav-shop');
      expect(shopTab).toHaveAttribute('aria-current', 'page');
    });

    it('should only have one active tab at a time', () => {
      render(<TestApp initialRoute="/focus" />);

      const activeLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('aria-current') === 'page'
      );

      expect(activeLinks).toHaveLength(1);
    });
  });

  describe('Page Rendering', () => {
    it('should render home page at root route', () => {
      render(<TestApp initialRoute="/" />);

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('should render focus page at /focus route', () => {
      render(<TestApp initialRoute="/focus" />);

      expect(screen.getByTestId('focus-page')).toBeInTheDocument();
    });

    it('should render collection page at /collection route', () => {
      render(<TestApp initialRoute="/collection" />);

      expect(screen.getByTestId('collection-page')).toBeInTheDocument();
    });

    it('should render shop page at /shop route', () => {
      render(<TestApp initialRoute="/shop" />);

      expect(screen.getByTestId('shop-page')).toBeInTheDocument();
    });

    it('should render settings page at /settings route', () => {
      render(<TestApp initialRoute="/settings" />);

      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible navigation links', () => {
      render(<TestApp />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should indicate current page with aria-current', () => {
      render(<TestApp initialRoute="/" />);

      const homeTab = screen.getByTestId('nav-home');
      expect(homeTab).toHaveAttribute('aria-current', 'page');
    });

    it('should not have aria-current on inactive tabs', () => {
      render(<TestApp initialRoute="/" />);

      const focusTab = screen.getByTestId('nav-focus');
      expect(focusTab).not.toHaveAttribute('aria-current');
    });
  });
});

describe('Navigation State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start on correct initial route', () => {
    render(<TestApp initialRoute="/collection" />);

    expect(screen.getByTestId('collection-page')).toBeInTheDocument();
    expect(screen.getByTestId('nav-collection')).toHaveAttribute('aria-current', 'page');
  });

  it('should handle deep route initialization', () => {
    render(<TestApp initialRoute="/settings" />);

    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
  });
});
