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
  'treasure-chest', 'ultra-crown',
  // Background themes
  'island', 'wave', 'cloud', 'sunset', 'sakura',
  'neon-city', 'aurora', 'volcano', 'fish', 'pumpkin', 'christmas-tree',
  // Section headers
  'picture-frame', 'backpack', 'fire', 'potion',
  // Achievement & gamification icons
  'sword', 'target', 'clock', 'muscle', 'running', 'superhero',
  'clapperboard', 'books', 'medal', 'meditation', 'fox', 'butterfly',
  'lion', 'elephant', 'owl', 'bird', 'crystal-ball', 'rainbow',
  'globe', 'heart', 'heart-ribbon', 'sun', 'sports-medal', 'shopping-cart',
  'party', 'slot-machine', 'question-mark', 'palette',
  'badge-bronze', 'badge-silver', 'badge-gold', 'hundred',
  'ferris-wheel', 'fireworks', 'shopping-bag', 'dollar',
  // Pet animals
  'frog', 'bee', 'squirrel', 'panda', 'bear', 'cat', 'rabbit', 'dog',
  'penguin', 'turtle', 'dragon', 'ghost', 'bat', 'shark', 'horse',
  // Nature/Items
  'sprout', 'four-leaf-clover', 'water-drop', 'teddy-bear', 'mushroom',
  // Characters
  'wizard', 'fairy', 'pirate', 'robot', 'space-invader', 'goblin', 'cat-smile',
  // Ambient sounds
  'radio', 'brain', 'fan', 'rain', 'coffee', 'cricket', 'thunderstorm',
  'car', 'train', 'airplane', 'open-book', 'sleeping', 'brown-noise', 'waterfall',
  // Biomes
  'meadow', 'snowflake', 'city',
  // Boss battle icons
  'boss-focus-warrior', 'boss-triple-threat', 'boss-deep-focus', 'boss-quintuple-strike',
  'boss-weekly-warrior', 'boss-marathon-runner', 'boss-perfect-day', 'boss-ultra-endurance',
  'boss-weekly-legend',
  // Starter bundle icons
  'bundle-welcome', 'bundle-starter', 'bundle-collector',
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
