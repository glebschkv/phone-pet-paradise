import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from "@/lib/logger";
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/errorReporting';
import { RATE_LIMIT_CONFIG } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
  lastErrorTime: number;
  isRetryDisabled: boolean;
  retryCountdown: number;
}

const { ERROR_BOUNDARY } = RATE_LIMIT_CONFIG;

export class ErrorBoundary extends Component<Props, State> {
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  public state: State = {
    hasError: false,
    retryCount: 0,
    lastErrorTime: 0,
    isRetryDisabled: false,
    retryCountdown: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Reset retry count if enough time has passed since last error
    const shouldResetCount = timeSinceLastError > ERROR_BOUNDARY.RETRY_RESET_WINDOW_MS;
    const newRetryCount = shouldResetCount ? 1 : this.state.retryCount + 1;

    // Generate error ID for support reference
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Report to error tracking service
    reportError(error, { boundary: true, errorId, retryCount: newRetryCount }, errorInfo.componentStack || undefined);

    this.setState({
      errorId,
      retryCount: newRetryCount,
      lastErrorTime: now,
    });

    logger.error('Error caught by boundary:', error, errorInfo, { retryCount: newRetryCount });
  }

  componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private calculateBackoffDelay(): number {
    const delay = ERROR_BOUNDARY.BASE_BACKOFF_DELAY_MS *
      Math.pow(ERROR_BOUNDARY.BACKOFF_MULTIPLIER, this.state.retryCount - 1);
    return Math.min(delay, ERROR_BOUNDARY.MAX_BACKOFF_DELAY_MS);
  }

  private handleRetry = () => {
    const delay = this.calculateBackoffDelay();

    // If delay is more than 1 second, show countdown
    if (delay > 1000) {
      this.setState({
        isRetryDisabled: true,
        retryCountdown: Math.ceil(delay / 1000),
      });

      this.countdownInterval = setInterval(() => {
        this.setState((prevState) => {
          const newCountdown = prevState.retryCountdown - 1;
          if (newCountdown <= 0) {
            if (this.countdownInterval) {
              clearInterval(this.countdownInterval);
              this.countdownInterval = null;
            }
            return {
              hasError: false,
              error: undefined,
              errorId: undefined,
              isRetryDisabled: false,
              retryCountdown: 0,
            };
          }
          return { retryCountdown: newCountdown };
        });
      }, 1000);
    } else {
      // Immediate retry for first attempt
      this.setState({
        hasError: false,
        error: undefined,
        errorId: undefined,
      });
    }
  };

  private get canRetry(): boolean {
    return this.state.retryCount < ERROR_BOUNDARY.MAX_RETRY_ATTEMPTS;
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount, isRetryDisabled, retryCountdown } = this.state;
      const remainingRetries = ERROR_BOUNDARY.MAX_RETRY_ATTEMPTS - retryCount;

      return (
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-indigo-950 p-4">
          <Alert className="max-w-md bg-white/10 border-white/20 text-white">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <AlertTitle className="text-lg font-bold">Oops! Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 text-white/80">
              <p>Don't worry - your data is safe. The app encountered an unexpected error.</p>
              {this.state.errorId && (
                <p className="mt-2 text-xs text-white/50 font-mono">
                  Error ID: {this.state.errorId}
                </p>
              )}
              {retryCount > 0 && this.canRetry && (
                <p className="mt-2 text-xs text-yellow-400">
                  Retries remaining: {remainingRetries}
                </p>
              )}
              {!this.canRetry && (
                <p className="mt-2 text-xs text-red-400">
                  Maximum retry attempts reached. Please restart the app.
                </p>
              )}
            </AlertDescription>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart App
              </Button>
              {this.canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetryDisabled}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {isRetryDisabled ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      {retryCountdown}s
                    </>
                  ) : (
                    'Try Again'
                  )}
                </Button>
              )}
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
