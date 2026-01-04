/**
 * Offline Status Indicator
 *
 * Displays a subtle indicator when the app is offline or has pending sync operations.
 * Shows sync progress and provides manual sync trigger.
 */

import { useOffline } from '@/contexts/OfflineContext';
import { Wifi, WifiOff, CloudOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineStatusIndicatorProps {
  className?: string;
  showAlways?: boolean;
}

export function OfflineStatusIndicator({
  className,
  showAlways = false,
}: OfflineStatusIndicatorProps) {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    hasPendingSync,
    syncNow,
  } = useOffline();

  // Don't render if online with no pending sync (unless showAlways)
  if (!showAlways && isOnline && !hasPendingSync && !isSyncing) {
    return null;
  }

  const handleSyncClick = () => {
    if (isOnline && hasPendingSync && !isSyncing) {
      syncNow();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        !isOnline && 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
        isOnline && hasPendingSync && 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        isOnline && isSyncing && 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        isOnline && !hasPendingSync && !isSyncing && 'bg-green-500/20 text-green-600 dark:text-green-400',
        className
      )}
      onClick={handleSyncClick}
      role={isOnline && hasPendingSync ? 'button' : undefined}
      title={
        !isOnline
          ? 'You are offline. Data is saved locally.'
          : hasPendingSync
          ? `${pendingCount} pending updates. Click to sync.`
          : 'All data synced'
      }
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : hasPendingSync ? (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          <span>{pendingCount} pending</span>
        </>
      ) : (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Synced</span>
        </>
      )}
    </div>
  );
}

/**
 * Compact version for tight spaces
 */
export function OfflineStatusDot({ className }: { className?: string }) {
  const { isOnline, hasPendingSync, isSyncing } = useOffline();

  // Don't render if all synced
  if (isOnline && !hasPendingSync && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        !isOnline && 'bg-amber-500',
        isOnline && hasPendingSync && 'bg-blue-500',
        isOnline && isSyncing && 'bg-blue-500 animate-pulse',
        className
      )}
      title={
        !isOnline
          ? 'Offline'
          : isSyncing
          ? 'Syncing...'
          : 'Pending sync'
      }
    />
  );
}
