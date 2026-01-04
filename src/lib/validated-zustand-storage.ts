/**
 * Validated Zustand Storage Adapter
 *
 * Provides a storage adapter for Zustand's persist middleware that validates
 * data on load using Zod schemas. This ensures corrupted or malicious data
 * in localStorage doesn't crash the application.
 *
 * Security benefits:
 * - Validates all data loaded from localStorage against schemas
 * - Provides safe defaults when validation fails
 * - Logs validation failures for debugging
 * - Prevents storing invalid data
 */

import { type StateStorage } from 'zustand/middleware';
import { z } from 'zod';
import { storageLogger } from '@/lib/logger';

export interface ValidatedStorageOptions<T> {
  /** Zod schema to validate stored data */
  schema: z.ZodSchema<T>;
  /** Default state to use if validation fails */
  defaultState: T;
  /** Storage key name (for logging) */
  name: string;
  /** Whether to log validation errors (default: true) */
  logErrors?: boolean;
  /** Whether to attempt repair on validation failure (default: true) */
  attemptRepair?: boolean;
}

/**
 * Creates a validated storage adapter for Zustand persist middleware.
 *
 * Usage:
 * ```ts
 * const store = create<MyStore>()(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'my-store',
 *       storage: createValidatedStorage({
 *         schema: myStateSchema,
 *         defaultState: initialState,
 *         name: 'my-store',
 *       }),
 *     }
 *   )
 * );
 * ```
 */
export function createValidatedStorage<T extends object>(
  options: ValidatedStorageOptions<T>
): StateStorage {
  const { schema, defaultState, name, logErrors = true, attemptRepair = true } = options;

  return {
    getItem: (key: string): string | null => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);

        // Zustand wraps state in { state: ..., version: ... }
        // We need to validate the inner state object
        if (parsed && typeof parsed === 'object' && 'state' in parsed) {
          const result = schema.safeParse(parsed.state);

          if (result.success) {
            // Return the full Zustand structure with validated state
            return JSON.stringify({ ...parsed, state: result.data });
          }

          if (logErrors) {
            const errorDetails = result.error.issues
              .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
              .join('; ');
            storageLogger.warn(`[ValidatedStorage] Validation failed for ${name}:`, errorDetails);
          }

          if (attemptRepair) {
            // Try to repair by using schema defaults for invalid fields
            // This uses Zod's default() values defined in the schema
            try {
              const validFields = filterValidFields(parsed.state, schema) as Record<string, unknown>;

              // CRITICAL: For XP-related stores, preserve progress data aggressively
              // This prevents accidental reset to level 0 when other fields are corrupted
              const rawState = parsed.state as Record<string, unknown>;
              if (typeof rawState.currentXP === 'number' && rawState.currentXP > 0) {
                validFields.currentXP = rawState.currentXP;
              }
              if (typeof rawState.currentLevel === 'number' && rawState.currentLevel > 0) {
                validFields.currentLevel = rawState.currentLevel;
              }

              // Create a partial parse that uses defaults
              const repaired = schema.parse({
                ...defaultState,
                ...validFields,
              });
              storageLogger.debug(`[ValidatedStorage] Repaired ${name} with defaults, preserved XP: ${(repaired as Record<string, unknown>).currentXP || 0}`);
              return JSON.stringify({ ...parsed, state: repaired });
            } catch {
              // Repair failed, use full defaults
              storageLogger.debug(`[ValidatedStorage] Using default state for ${name}`);
            }
          }

          // Return default state wrapped in Zustand structure
          return JSON.stringify({ ...parsed, state: defaultState });
        }

        // If the structure is unexpected, return null to trigger rehydration with defaults
        return null;
      } catch (error) {
        if (logErrors) {
          storageLogger.error(`[ValidatedStorage] Error loading ${name}:`, error);
        }
        return null;
      }
    },

    setItem: (key: string, value: string): void => {
      try {
        const parsed = JSON.parse(value);

        // Validate before storing
        if (parsed && typeof parsed === 'object' && 'state' in parsed) {
          const result = schema.safeParse(parsed.state);

          if (!result.success) {
            if (logErrors) {
              const errorDetails = result.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join('; ');
              storageLogger.warn(
                `[ValidatedStorage] Refusing to store invalid data for ${name}:`,
                errorDetails
              );
            }
            // Don't store invalid data - this prevents corruption
            return;
          }

          // Store with validated data
          localStorage.setItem(key, JSON.stringify({ ...parsed, state: result.data }));
          return;
        }

        // Store as-is if structure is not recognized
        localStorage.setItem(key, value);
      } catch (error) {
        if (logErrors) {
          storageLogger.error(`[ValidatedStorage] Error saving ${name}:`, error);
        }
      }
    },

    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    },
  };
}

/**
 * Filter an object to only include fields that pass schema validation
 */
function filterValidFields<T>(data: unknown, schema: z.ZodSchema<T>): Partial<T> {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const result: Record<string, unknown> = {};

  // For object schemas, try to validate each field individually
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      if (key in (data as Record<string, unknown>)) {
        const fieldValue = (data as Record<string, unknown>)[key];
        const fieldResult = fieldSchema.safeParse(fieldValue);

        if (fieldResult.success) {
          result[key] = fieldResult.data;
        }
      }
    }
  }

  return result as Partial<T>;
}

/**
 * Wrapper around Zustand's onRehydrateStorage that adds validation
 *
 * Usage in persist config:
 * ```ts
 * {
 *   name: 'my-store',
 *   onRehydrateStorage: createValidatedRehydrateHandler({
 *     schema: myStateSchema,
 *     name: 'my-store',
 *     onSuccess: (state) => console.log('Rehydrated:', state),
 *     onError: (error) => console.error('Rehydration failed:', error),
 *   }),
 * }
 * ```
 */
export interface RehydrateHandlerOptions<T> {
  schema: z.ZodSchema<T>;
  name: string;
  onSuccess?: (state: T) => void;
  onError?: (error: Error) => void;
}

export function createValidatedRehydrateHandler<T>(
  options: RehydrateHandlerOptions<T>
): () => ((state: T | undefined, error?: unknown) => void) | undefined {
  const { schema, name, onSuccess, onError } = options;

  return () => (state, error) => {
    if (error) {
      storageLogger.error(`[ValidatedStorage] Rehydration error for ${name}:`, error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    if (state) {
      // Validate the rehydrated state
      const result = schema.safeParse(state);

      if (result.success) {
        storageLogger.debug(`[ValidatedStorage] ${name} rehydrated and validated`);
        onSuccess?.(result.data);
      } else {
        const errorDetails = result.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        storageLogger.warn(
          `[ValidatedStorage] ${name} rehydrated but validation failed:`,
          errorDetails
        );
        onError?.(new Error(`Validation failed: ${errorDetails}`));
      }
    }
  };
}
