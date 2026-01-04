/**
 * Theme Types
 *
 * Consolidated theme and visual styling type definitions.
 */

// ============================================================================
// App Theme Types
// ============================================================================

/**
 * App color mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * App theme configuration
 */
export interface AppTheme {
  mode: ThemeMode;
  primaryColor?: string;
}

/**
 * Theme store state
 */
export interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  primaryColor?: string;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
}

// ============================================================================
// Background Theme Types
// ============================================================================

/**
 * Timer background theme options
 */
export type BackgroundTheme =
  | 'default'
  | 'gradient'
  | 'nature'
  | 'space'
  | 'ocean'
  | 'custom';

/**
 * Premium background configuration
 */
export interface BackgroundConfig {
  id: string;
  theme: string;
  previewImage?: string;
  gradient?: string;
  isAnimated?: boolean;
}

// ============================================================================
// Season Theme Types
// ============================================================================

/**
 * Seasonal theme options for battle pass
 */
export type SeasonTheme =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'cosmic'
  | 'ocean';

/**
 * Season visual configuration
 */
export interface SeasonThemeConfig {
  theme: SeasonTheme;
  backgroundGradient: string;
  accentColor: string;
  particleEffect?: 'snow' | 'leaves' | 'petals' | 'stars' | 'bubbles';
}

// ============================================================================
// Biome Theme Types
// ============================================================================

/**
 * Available biome themes
 */
export type BiomeTheme =
  | 'Meadow'
  | 'Sunset'
  | 'Night'
  | 'Cosmic'
  | 'Ocean'
  | 'Volcano'
  | 'Crystal'
  | 'Sky';

/**
 * Biome visual configuration
 */
export interface BiomeConfig {
  id: string;
  name: BiomeTheme;
  description: string;
  unlockLevel: number;
  backgroundGradient: string;
  ambientColor: string;
}

// ============================================================================
// Celebration Theme Types
// ============================================================================

/**
 * Types of celebration animations
 */
export type CelebrationType =
  | 'confetti'
  | 'fireworks'
  | 'stars'
  | 'rainbow';

/**
 * Celebration configuration
 */
export interface CelebrationConfig {
  type: CelebrationType;
  duration: number;
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
}
