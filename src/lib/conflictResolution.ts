/**
 * Conflict Resolution Strategies for Offline Sync
 *
 * Provides multiple conflict resolution strategies beyond simple last-write-wins:
 * - Field-level merging for partial updates
 * - Version vectors for detecting conflicts
 * - Domain-specific resolution rules
 *
 * Architecture:
 * - Each sync operation type can have its own resolution strategy
 * - Conflicts are detected before sync, not after
 * - User data is preserved when possible
 */

import { syncLogger } from '@/lib/logger';
import type { SyncOperationType, PendingSyncOperation } from '@/stores/offlineSyncStore';

// Version vector for conflict detection
export interface VersionVector {
  clientVersion: number;
  serverVersion: number;
  lastSyncedAt: number;
}

// Conflict detection result
export interface ConflictResult {
  hasConflict: boolean;
  conflictType: 'none' | 'update-update' | 'update-delete' | 'stale-client';
  resolution: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  mergedData?: Record<string, unknown>;
}

// Resolution strategy for each operation type
type ResolutionStrategy = 'last-write-wins' | 'client-wins' | 'server-wins' | 'field-merge' | 'additive';

const RESOLUTION_STRATEGIES: Record<SyncOperationType, ResolutionStrategy> = {
  // XP and coins should be additive - never lose progress
  xp_update: 'additive',
  coin_update: 'additive',
  streak_update: 'client-wins', // Streaks are time-sensitive, trust client

  // Progress updates can be merged at field level
  progress_update: 'field-merge',
  profile_update: 'field-merge',

  // Quest updates should use higher progress value
  quest_update: 'additive',

  // Achievement unlocks are additive - can't un-unlock
  achievement_unlock: 'additive',

  // Pet interactions use client values (bond level, experience)
  pet_interaction: 'client-wins',

  // Focus sessions are append-only
  focus_session: 'additive',
};

/**
 * Detect if there's a conflict between client and server data
 */
export function detectConflict(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown> | null,
  clientVersion: VersionVector,
  serverVersion?: VersionVector
): ConflictResult {
  // No server data means no conflict
  if (!serverData) {
    return {
      hasConflict: false,
      conflictType: 'none',
      resolution: 'client-wins',
    };
  }

  // No version info means we can't detect conflicts reliably
  if (!serverVersion) {
    return {
      hasConflict: false,
      conflictType: 'none',
      resolution: 'client-wins',
    };
  }

  // Check if client is stale
  if (clientVersion.serverVersion < serverVersion.serverVersion) {
    // Server was updated since client's last sync
    return {
      hasConflict: true,
      conflictType: 'update-update',
      resolution: 'merge',
    };
  }

  return {
    hasConflict: false,
    conflictType: 'none',
    resolution: 'client-wins',
  };
}

/**
 * Resolve a conflict based on the operation type
 */
export function resolveConflict(
  operationType: SyncOperationType,
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  const strategy = RESOLUTION_STRATEGIES[operationType];

  switch (strategy) {
    case 'client-wins':
      syncLogger.debug(`[ConflictResolution] Using client-wins for ${operationType}`);
      return clientData;

    case 'server-wins':
      syncLogger.debug(`[ConflictResolution] Using server-wins for ${operationType}`);
      return serverData;

    case 'additive':
      syncLogger.debug(`[ConflictResolution] Using additive merge for ${operationType}`);
      return resolveAdditive(clientData, serverData);

    case 'field-merge':
      syncLogger.debug(`[ConflictResolution] Using field-merge for ${operationType}`);
      return resolveFieldMerge(clientData, serverData);

    case 'last-write-wins':
    default:
      // Compare timestamps
      const clientTime = (clientData.updatedAt as number) || (clientData.updated_at as number) || 0;
      const serverTime = (serverData.updatedAt as number) || (serverData.updated_at as number) || 0;

      if (clientTime >= serverTime) {
        syncLogger.debug(`[ConflictResolution] Client wins (newer timestamp) for ${operationType}`);
        return clientData;
      } else {
        syncLogger.debug(`[ConflictResolution] Server wins (newer timestamp) for ${operationType}`);
        return serverData;
      }
  }
}

/**
 * Additive resolution - take the maximum/sum of numeric fields
 * Used for XP, coins, progress that should never go backwards
 */
function resolveAdditive(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...serverData };

  // Numeric fields that should use MAX
  const maxFields = [
    'total_xp', 'totalXp',
    'current_level', 'currentLevel',
    'coins', 'balance',
    'total_earned', 'totalEarned',
    'progress',
    'bond_level', 'bondLevel',
    'experience',
    'current_streak', 'currentStreak',
    'longest_streak', 'longestStreak',
  ];

  // Numeric fields that should be SUMMED (for session-based additions)
  const sumFields = [
    // None currently - most fields should use MAX
  ];

  for (const key of Object.keys(clientData)) {
    const clientValue = clientData[key];
    const serverValue = serverData[key];

    if (typeof clientValue === 'number' && typeof serverValue === 'number') {
      if (maxFields.includes(key)) {
        // Take the maximum value
        result[key] = Math.max(clientValue, serverValue);
      } else if (sumFields.includes(key)) {
        // Sum the values (rare case)
        result[key] = clientValue + serverValue;
      } else {
        // Default to client value for other numeric fields
        result[key] = clientValue;
      }
    } else if (clientValue !== undefined) {
      // For non-numeric fields, prefer client value
      result[key] = clientValue;
    }
  }

  return result;
}

/**
 * Field-level merge - merge individual fields based on their timestamps
 */
function resolveFieldMerge(
  clientData: Record<string, unknown>,
  serverData: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...serverData };

  // For field-level merge, we need field-level timestamps
  // If not available, fall back to record-level timestamp comparison
  const clientTime = (clientData.updatedAt as number) || (clientData.updated_at as number) || Date.now();

  // Merge each field from client if it exists
  for (const key of Object.keys(clientData)) {
    // Skip metadata fields
    if (key === 'updatedAt' || key === 'updated_at' || key === 'createdAt' || key === 'created_at') {
      continue;
    }

    const clientValue = clientData[key];
    const serverValue = serverData[key];

    // If server doesn't have the field, use client value
    if (serverValue === undefined || serverValue === null) {
      result[key] = clientValue;
    }
    // If values are different, prefer client (more recent action)
    else if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
      result[key] = clientValue;
    }
  }

  // Update the timestamp
  result.updated_at = new Date().toISOString();

  return result;
}

/**
 * Deduplicate pending operations before sync
 * Keeps only the most recent operation for each resource
 */
export function deduplicateOperations(
  operations: PendingSyncOperation[]
): PendingSyncOperation[] {
  const operationMap = new Map<string, PendingSyncOperation>();

  // Sort by creation time (oldest first)
  const sorted = [...operations].sort((a, b) => a.createdAt - b.createdAt);

  for (const op of sorted) {
    // Create a key based on operation type and resource identifier
    let key: string;

    switch (op.type) {
      case 'xp_update':
      case 'coin_update':
      case 'progress_update':
      case 'streak_update':
      case 'profile_update':
        // These are user-level, only keep the latest
        key = op.type;
        break;

      case 'quest_update':
        // Quest updates are per-quest
        key = `${op.type}:${op.payload.questId}`;
        break;

      case 'achievement_unlock':
        // Achievement unlocks are per-achievement (and additive)
        key = `${op.type}:${op.payload.achievementId}`;
        break;

      case 'pet_interaction':
        // Pet interactions are per-pet
        key = `${op.type}:${op.payload.petType}`;
        break;

      case 'focus_session':
        // Focus sessions are unique by completed_at
        key = `${op.type}:${op.payload.completedAt || op.createdAt}`;
        break;

      default:
        key = `${op.type}:${op.id}`;
    }

    // For most operations, replace with newer
    // For additive operations, merge the data
    const existing = operationMap.get(key);
    if (existing && RESOLUTION_STRATEGIES[op.type] === 'additive') {
      // Merge the payloads
      const mergedPayload = resolveAdditive(op.payload, existing.payload);
      operationMap.set(key, { ...op, payload: mergedPayload });
    } else {
      // Just keep the newer operation
      operationMap.set(key, op);
    }
  }

  return Array.from(operationMap.values());
}

/**
 * Validate operation data before sync
 * Returns true if valid, false if should be skipped
 */
export function validateOperation(operation: PendingSyncOperation): boolean {
  const { type, payload } = operation;

  switch (type) {
    case 'xp_update':
      return typeof payload.totalXp === 'number' && typeof payload.currentLevel === 'number';

    case 'coin_update':
      return typeof payload.coins === 'number';

    case 'progress_update':
      return payload !== null && Object.keys(payload).length > 0;

    case 'quest_update':
      return typeof payload.questId === 'string' && typeof payload.progress === 'number';

    case 'achievement_unlock':
      return typeof payload.achievementId === 'string';

    case 'pet_interaction':
      return typeof payload.petType === 'string';

    case 'focus_session':
      return typeof payload.durationMinutes === 'number';

    case 'streak_update':
      return typeof payload.currentStreak === 'number';

    case 'profile_update':
      return payload !== null && Object.keys(payload).length > 0;

    default:
      return true;
  }
}
