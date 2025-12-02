/**
 * Shared sprite scaling utilities and constants
 * Ensures consistent sprite rendering across all components
 */

// Base scale factors for different sprite contexts
export const SPRITE_SCALE = {
  // Base scale for ground animals on home screen
  GROUND_BASE: 2.5,
  // Base scale for flying animals (slightly smaller)
  FLYING_BASE: 2.0,
  // Maximum rendered size in pixels to prevent mobile overflow
  MAX_RENDERED_SIZE: 160,
};

// Wrapping thresholds for sprite position (normalized 0-1 screen position)
export const SPRITE_WRAP = {
  // Position at which sprite exits screen (right side)
  EXIT_THRESHOLD: 1.15,
  // Position where sprite re-enters screen (left side)
  ENTRY_POSITION: -0.15,
};

// Minimum scale floors for preview contexts to keep large sprites visible
export const PREVIEW_MIN_SCALE = {
  // Grid/list view (small thumbnails)
  LIST: 0.3,
  // Detail modal view
  DETAIL: 0.5,
  // Shop card previews
  SHOP_CARD: 0.35,
  // Bundle preview
  BUNDLE: 0.3,
};

/**
 * Calculate responsive scale for animated sprites on the home screen
 * Ensures large sprites don't overflow mobile screens
 *
 * @param frameWidth - Width of a single sprite frame
 * @param frameHeight - Height of a single sprite frame
 * @param baseScale - The base scale factor to use (e.g., 2.5 for ground, 2.0 for flying)
 * @returns Scale factor that respects mobile screen constraints
 */
export const getAnimationScale = (
  frameWidth: number,
  frameHeight: number,
  baseScale: number
): number => {
  const maxDimension = Math.max(frameWidth, frameHeight);
  return Math.min(baseScale, SPRITE_SCALE.MAX_RENDERED_SIZE / maxDimension);
};

/**
 * Calculate scale for sprite previews in UI components (grids, modals, shop)
 * Ensures sprites fit within target container while remaining visible
 *
 * @param frameWidth - Width of a single sprite frame
 * @param frameHeight - Height of a single sprite frame
 * @param targetSize - Target container size in pixels
 * @param maxScale - Maximum scale cap (prevents small sprites from getting too large)
 * @param minScale - Minimum scale floor (prevents large sprites from becoming invisible)
 * @returns Scale factor optimized for the preview context
 */
export const getPreviewScale = (
  frameWidth: number,
  frameHeight: number,
  targetSize: number,
  maxScale: number,
  minScale: number
): number => {
  const maxDimension = Math.max(frameWidth, frameHeight);
  const fitScale = targetSize / maxDimension;
  return Math.max(minScale, Math.min(maxScale, fitScale));
};
