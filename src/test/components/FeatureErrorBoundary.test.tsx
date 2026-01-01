import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FeatureErrorBoundary,
  TimerErrorBoundary,
  CollectionErrorBoundary,
  ShopErrorBoundary,
  AnalyticsErrorBoundary,
  GamificationErrorBoundary,
  SettingsErrorBoundary,
  AchievementsErrorBoundary,
  QuestsErrorBoundary,
  StreaksErrorBoundary,
} from '@/components/FeatureErrorBoundary';

// Mock error reporting
vi.mock('@/lib/errorReporting', () => ({
  reportError: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working Component</div>;
};

// Suppress console.error during tests since we expect errors
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('FeatureErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <div>Test Content</div>
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error UI when error occurs', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Test Feature unavailable')).toBeInTheDocument();
    expect(screen.getByText('This feature encountered an error and couldn\'t load.')).toBeInTheDocument();
  });

  it('displays retry button with correct count', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument();
  });

  it('allows retry and decrements count', () => {
    let throwError = true;
    const TestComponent = () => {
      if (throwError) {
        throw new Error('Test error');
      }
      return <div>Working now!</div>;
    };

    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <TestComponent />
      </FeatureErrorBoundary>
    );

    // First error
    expect(screen.getByText(/Try Again \(3 left\)/)).toBeInTheDocument();

    // Set to not throw on next render
    throwError = false;

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /Try Again/ }));

    // Should now show the working component
    expect(screen.getByText('Working now!')).toBeInTheDocument();
  });

  it('shows different message after max retries', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature">
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    // Click retry 3 times
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.queryByRole('button', { name: /Try Again/ });
      if (retryButton) {
        fireEvent.click(retryButton);
      }
    }

    // Should show "Please refresh" message instead of retry button
    expect(screen.getByText('Please refresh the page to try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Try Again/ })).not.toBeInTheDocument();
  });

  it('hides retry button when showRetry is false', () => {
    render(
      <FeatureErrorBoundary featureName="Test Feature" showRetry={false}>
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(screen.queryByRole('button', { name: /Try Again/ })).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <FeatureErrorBoundary
        featureName="Test Feature"
        fallback={<div>Custom Error UI</div>}
      >
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Test Feature unavailable')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <FeatureErrorBoundary featureName="Test Feature" onError={onError}>
        <ErrorThrowingComponent />
      </FeatureErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

describe('Feature-specific ErrorBoundaries', () => {
  it('TimerErrorBoundary shows "Focus Timer unavailable"', () => {
    render(
      <TimerErrorBoundary>
        <ErrorThrowingComponent />
      </TimerErrorBoundary>
    );

    expect(screen.getByText('Focus Timer unavailable')).toBeInTheDocument();
  });

  it('CollectionErrorBoundary shows "Collection unavailable"', () => {
    render(
      <CollectionErrorBoundary>
        <ErrorThrowingComponent />
      </CollectionErrorBoundary>
    );

    expect(screen.getByText('Collection unavailable')).toBeInTheDocument();
  });

  it('ShopErrorBoundary shows "Shop unavailable"', () => {
    render(
      <ShopErrorBoundary>
        <ErrorThrowingComponent />
      </ShopErrorBoundary>
    );

    expect(screen.getByText('Shop unavailable')).toBeInTheDocument();
  });

  it('AnalyticsErrorBoundary shows "Analytics unavailable"', () => {
    render(
      <AnalyticsErrorBoundary>
        <ErrorThrowingComponent />
      </AnalyticsErrorBoundary>
    );

    expect(screen.getByText('Analytics unavailable')).toBeInTheDocument();
  });

  it('GamificationErrorBoundary shows "Gamification unavailable"', () => {
    render(
      <GamificationErrorBoundary>
        <ErrorThrowingComponent />
      </GamificationErrorBoundary>
    );

    expect(screen.getByText('Gamification unavailable')).toBeInTheDocument();
  });

  it('SettingsErrorBoundary shows "Settings unavailable"', () => {
    render(
      <SettingsErrorBoundary>
        <ErrorThrowingComponent />
      </SettingsErrorBoundary>
    );

    expect(screen.getByText('Settings unavailable')).toBeInTheDocument();
  });

  it('AchievementsErrorBoundary shows "Achievements unavailable"', () => {
    render(
      <AchievementsErrorBoundary>
        <ErrorThrowingComponent />
      </AchievementsErrorBoundary>
    );

    expect(screen.getByText('Achievements unavailable')).toBeInTheDocument();
  });

  it('QuestsErrorBoundary shows "Quests unavailable"', () => {
    render(
      <QuestsErrorBoundary>
        <ErrorThrowingComponent />
      </QuestsErrorBoundary>
    );

    expect(screen.getByText('Quests unavailable')).toBeInTheDocument();
  });

  it('StreaksErrorBoundary shows "Streaks unavailable"', () => {
    render(
      <StreaksErrorBoundary>
        <ErrorThrowingComponent />
      </StreaksErrorBoundary>
    );

    expect(screen.getByText('Streaks unavailable')).toBeInTheDocument();
  });
});
