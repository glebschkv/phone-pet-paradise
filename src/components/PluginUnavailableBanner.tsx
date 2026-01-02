/**
 * Plugin Unavailable Banner
 *
 * Displays a dismissible banner when critical native plugins
 * are unavailable or have errors.
 */

import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNativePlugins } from '@/contexts/NativePluginContext';
import { cn } from '@/lib/utils';

interface PluginUnavailableBannerProps {
  className?: string;
}

export function PluginUnavailableBanner({ className }: PluginUnavailableBannerProps) {
  const { showBanner, dismissBanner, recheckPlugins, status, isChecking } = useNativePlugins();

  if (!showBanner) {
    return null;
  }

  // Determine which plugins have errors
  const errorPlugins: string[] = [];
  if (status.plugins.deviceActivity === 'error') {
    errorPlugins.push('Screen Time');
  }
  if (status.plugins.storeKit === 'error') {
    errorPlugins.push('In-App Purchases');
  }
  if (status.plugins.widgetData === 'error') {
    errorPlugins.push('Widget Data');
  }

  const handleRetry = async () => {
    await recheckPlugins();
  };

  return (
    <div
      className={cn(
        'bg-amber-500/90 text-amber-950 px-4 py-3',
        'flex items-center justify-between gap-3',
        'backdrop-blur-sm border-b border-amber-600/50',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            Some features are unavailable
          </p>
          {errorPlugins.length > 0 && (
            <p className="text-xs text-amber-800 truncate">
              {errorPlugins.join(', ')} {errorPlugins.length === 1 ? 'is' : 'are'} not working properly
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isChecking}
          className="text-amber-950 hover:bg-amber-600/30 h-8 px-2"
          aria-label="Retry loading plugins"
        >
          <RefreshCw className={cn('h-4 w-4', isChecking && 'animate-spin')} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissBanner}
          className="text-amber-950 hover:bg-amber-600/30 h-8 px-2"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact inline banner for use within specific sections
 */
export function PluginErrorInline({
  pluginName,
  message,
  className,
}: {
  pluginName: string;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
        'rounded-lg px-3 py-2 flex items-center gap-2 text-sm',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        {message || `${pluginName} is unavailable. Some features may not work.`}
      </span>
    </div>
  );
}
