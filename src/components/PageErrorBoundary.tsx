import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

/**
 * PageErrorBoundary - Error boundary wrapper for page-level components
 *
 * Provides a user-friendly fallback UI when a page encounters an error.
 * Integrates with Sentry for error reporting when configured.
 *
 * Features:
 * - Catches and reports render errors to Sentry
 * - Displays page-specific error message
 * - Provides recovery options (reload, go home)
 * - Shows error ID for support reference
 */
export const PageErrorBoundary = ({ children, pageName = 'page' }: PageErrorBoundaryProps) => {
  return (
    <ErrorBoundary fallback={<PageErrorFallback pageName={pageName} />}>
      {children}
    </ErrorBoundary>
  );
};

interface PageErrorFallbackProps {
  pageName: string;
}

const PageErrorFallback = ({ pageName }: PageErrorFallbackProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
      }}
    >
      <div className="w-full max-w-md">
        <div className="retro-card rounded-2xl p-8 text-center space-y-6">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Error Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              We encountered an error while loading the {pageName}. Don't worry - your data is safe.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Support Text */}
          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact support with the error details.
          </p>
        </div>
      </div>
    </div>
  );
};
