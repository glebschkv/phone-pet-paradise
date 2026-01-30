import { memo } from 'react';

/**
 * All available pixel art icon names.
 * Each maps to a PNG file in /assets/icons/{name}.png
 * generated via PixelLab AI pixel art API.
 */
const ICON_NAMES = new Set([
  // Category tabs
  'star', 'paw', 'gift', 'lightning',
  // Boosters / power-ups
  'rocket', 'calendar',
  // Coin packs
  'coin', 'money-bag', 'diamond', 'trophy',
  // Utility
  'ice-cube',
  // Bundles
  'sparkles', 'moon', 'masks', 'leaf', 'crown', 'sun-cloud',
  // Background themes
  'island', 'wave', 'cloud', 'sunset', 'sakura',
  'neon-city', 'aurora', 'volcano', 'fish', 'pumpkin', 'christmas-tree',
  // Section headers
  'picture-frame', 'backpack', 'fire', 'potion',
]);

interface PixelIconProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a PixelLab-generated pixel art icon as a PNG image.
 * Falls back to displaying the name as text if no icon exists.
 */
export const PixelIcon = memo(function PixelIcon({ name, size = 24, className }: PixelIconProps) {
  if (!ICON_NAMES.has(name)) {
    return <span className={className} style={{ fontSize: size * 0.6, lineHeight: 1 }}>{name}</span>;
  }

  return (
    <img
      src={`/assets/icons/${name}.png`}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      draggable={false}
    />
  );
});
