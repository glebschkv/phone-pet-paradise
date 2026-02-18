import { vi } from 'vitest';

/**
 * Creates a complete mock of @/lib/logger with every exported logger.
 *
 * Usage in test files:
 *   import { createMockLoggers } from '../helpers/mockLoggers';
 *   vi.mock('@/lib/logger', () => createMockLoggers());
 */
export function createMockLoggers() {
  const l = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  return {
    createLogger: vi.fn(() => l()),
    logger: l(),
    storeKitLogger: l(),
    authLogger: l(),
    xpLogger: l(),
    notificationLogger: l(),
    syncLogger: l(),
    deviceActivityLogger: l(),
    focusModeLogger: l(),
    widgetLogger: l(),
    storageLogger: l(),
    supabaseLogger: l(),
    backupLogger: l(),
    threeLogger: l(),
    timerLogger: l(),
    questLogger: l(),
    achievementLogger: l(),
    shopLogger: l(),
    coinLogger: l(),
    bondLogger: l(),
    streakLogger: l(),
    soundLogger: l(),
    performanceLogger: l(),
    appReviewLogger: l(),
    settingsLogger: l(),
    collectionLogger: l(),
    nativePluginLogger: l(),
    analyticsLogger: l(),
  };
}
