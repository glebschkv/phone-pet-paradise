import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/errorReporting';
import { logger } from '@/lib/logger';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * FeatureErrorBoundary - Lightweight error boundary for feature-level components
 *
 * Unlike the full-page ErrorBoundary, this provides an inline error state
 * that allows other features on the page to continue working.
 *
 * Usage:
 * <FeatureErrorBoundary featureName="Timer">
 *   <FocusTimer />
 * </FeatureErrorBoundary>
 */
export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  private static MAX_RETRIES = 3;

  public state: FeatureErrorBoundaryState = {
    hasError: false,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<FeatureErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { featureName, onError } = this.props;

    // Report to error tracking service
    reportError(error, {
      feature: featureName,
      boundary: true,
      retryCount: this.state.retryCount,
    }, errorInfo.componentStack || undefined);

    logger.error(`Error in ${featureName} feature:`, error, errorInfo);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: newRetryCount,
    });
  };

  public render() {
    const { children, featureName, fallback, showRetry = true } = this.props;
    const { hasError, retryCount } = this.state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < FeatureErrorBoundary.MAX_RETRIES;

      return (
        <div className="w-full p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                {featureName} unavailable
              </h3>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                This feature encountered an error and couldn't load.
              </p>
              {showRetry && canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Try Again ({FeatureErrorBoundary.MAX_RETRIES - retryCount} left)
                </Button>
              )}
              {!canRetry && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-500">
                  Please refresh the page to try again.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Convenient wrapper components for specific features
export const TimerErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Focus Timer">
    {children}
  </FeatureErrorBoundary>
);

export const CollectionErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Collection">
    {children}
  </FeatureErrorBoundary>
);

export const ShopErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Shop">
    {children}
  </FeatureErrorBoundary>
);

export const AnalyticsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Analytics">
    {children}
  </FeatureErrorBoundary>
);

export const GamificationErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Gamification">
    {children}
  </FeatureErrorBoundary>
);

export const SettingsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Settings">
    {children}
  </FeatureErrorBoundary>
);

export const AchievementsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Achievements">
    {children}
  </FeatureErrorBoundary>
);

export const QuestsErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Quests">
    {children}
  </FeatureErrorBoundary>
);

export const StreaksErrorBoundary = ({ children }: { children: ReactNode }) => (
  <FeatureErrorBoundary featureName="Streaks">
    {children}
  </FeatureErrorBoundary>
);

// Modal-specific error boundaries with compact fallback
export const ModalErrorBoundary = ({ children, modalName }: { children: ReactNode; modalName: string }) => (
  <FeatureErrorBoundary
    featureName={modalName}
    fallback={
      <div className="p-4 text-center text-sm text-muted-foreground">
        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
        <p>Unable to load {modalName.toLowerCase()}</p>
      </div>
    }
    showRetry={false}
  >
    {children}
  </FeatureErrorBoundary>
);

export const RewardModalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ModalErrorBoundary modalName="Reward">
    {children}
  </ModalErrorBoundary>
);

export const PurchaseModalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ModalErrorBoundary modalName="Purchase">
    {children}
  </ModalErrorBoundary>
);

export const PetDetailErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ModalErrorBoundary modalName="Pet Details">
    {children}
  </ModalErrorBoundary>
);
