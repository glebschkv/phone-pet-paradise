import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from "@/lib/logger";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { reportError } from '@/lib/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate error ID for support reference
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Report to error tracking service
    reportError(error, { boundary: true, errorId }, errorInfo.componentStack || undefined);

    this.setState({ errorId });
    logger.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
            </AlertDescription>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart App
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined, errorId: undefined })}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Try Again
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
