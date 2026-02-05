/**
 * useAutoBackup Hook
 *
 * Automatically backs up critical user data to localStorage on a periodic basis.
 * Keeps a rolling window of recent backups so data can be recovered if the primary
 * stores become corrupted.
 *
 * Backup strategy:
 * - Runs every 5 minutes while the app is active
 * - Saves on page visibility change (user leaving the app)
 * - Keeps the 3 most recent backups
 * - Only saves if data has changed since the last backup
 */

import { useEffect, useRef, useCallback } from 'react';
import { backupLogger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { APP_CONFIG } from '@/lib/constants';

const AUTO_BACKUP_KEY = `${APP_CONFIG.STORAGE_PREFIX}auto_backups`;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_BACKUPS = 3;

interface AutoBackupEntry {
  timestamp: number;
  data: Record<string, string | null>;
}

// Keys critical to user progress — these are what we back up
const CRITICAL_KEYS = [
  STORAGE_KEYS.XP_SYSTEM,
  STORAGE_KEYS.STREAK_DATA,
  STORAGE_KEYS.COIN_SYSTEM,
  STORAGE_KEYS.COLLECTION,
  STORAGE_KEYS.ACHIEVEMENTS,
  STORAGE_KEYS.QUEST_SYSTEM_DATA,
  STORAGE_KEYS.SHOP_INVENTORY,
  STORAGE_KEYS.BATTLE_PASS,
  STORAGE_KEYS.PREMIUM_STATUS,
  STORAGE_KEYS.APP_SETTINGS,
  STORAGE_KEYS.ONBOARDING_COMPLETED,
] as const;

function collectCriticalData(): Record<string, string | null> {
  const snapshot: Record<string, string | null> = {};
  for (const key of CRITICAL_KEYS) {
    snapshot[key] = localStorage.getItem(key);
  }
  return snapshot;
}

function getStoredBackups(): AutoBackupEntry[] {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBackups(backups: AutoBackupEntry[]): void {
  try {
    localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backups));
  } catch {
    backupLogger.error('Failed to persist auto-backup');
  }
}

/**
 * Creates a fingerprint of the data so we can skip no-op saves.
 * Uses a simple concatenation hash — not cryptographic, just for change detection.
 */
function fingerprint(data: Record<string, string | null>): string {
  return Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v?.length ?? 0}`)
    .join('|');
}

export function useAutoBackup() {
  const lastFingerprintRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const performBackup = useCallback(() => {
    try {
      const data = collectCriticalData();
      const fp = fingerprint(data);

      // Skip if nothing changed
      if (fp === lastFingerprintRef.current) {
        return;
      }
      lastFingerprintRef.current = fp;

      const backups = getStoredBackups();
      backups.unshift({ timestamp: Date.now(), data });

      // Keep only the most recent backups
      while (backups.length > MAX_BACKUPS) {
        backups.pop();
      }

      saveBackups(backups);
      backupLogger.debug('Auto-backup saved');
    } catch (e) {
      backupLogger.error('Auto-backup failed:', e);
    }
  }, []);

  useEffect(() => {
    // Perform an initial backup shortly after mount
    const initialTimeout = setTimeout(performBackup, 10_000);

    // Set up periodic backups
    intervalRef.current = setInterval(performBackup, BACKUP_INTERVAL_MS);

    // Back up when user leaves the page / switches apps
    const handleVisibilityChange = () => {
      if (document.hidden) {
        performBackup();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performBackup]);
}

/**
 * Retrieve the most recent auto-backup for recovery purposes.
 * Returns null if no backups exist.
 */
export function getLatestAutoBackup(): AutoBackupEntry | null {
  const backups = getStoredBackups();
  return backups[0] ?? null;
}

/**
 * Restore from an auto-backup entry.
 * Only writes keys that have non-null values in the backup.
 */
export function restoreAutoBackup(backup: AutoBackupEntry): void {
  for (const [key, value] of Object.entries(backup.data)) {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  }
  backupLogger.info('Restored from auto-backup dated', new Date(backup.timestamp).toISOString());
}
