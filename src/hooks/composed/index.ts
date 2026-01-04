/**
 * Composed Hooks
 *
 * These hooks provide domain-specific state management by composing
 * multiple lower-level hooks. They are the building blocks for
 * useBackendAppState and can be used independently when only
 * specific functionality is needed.
 *
 * Benefits:
 * - Smaller bundle size when only using what you need
 * - Clearer dependencies and better testability
 * - More focused re-renders
 */

export { useProgressState } from './useProgressState';
export type { ProgressState, ProgressActions } from './useProgressState';

export { useCurrencyState } from './useCurrencyState';
export type { CurrencyState, CurrencyActions } from './useCurrencyState';

export { useGamificationState } from './useGamificationState';
export type { GamificationState, GamificationActions } from './useGamificationState';

export { usePetState } from './usePetState';
export type { PetState, PetActions, PetInteractionResult } from './usePetState';
