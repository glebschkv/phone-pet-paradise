import { memo, useMemo, useState, useEffect } from 'react';
import { RetroBackground } from './RetroBackground';
import { PixelPlatform } from './PixelPlatform';
import { AnimalParade } from './AnimalParade';
import { FlyingAnimalParade } from './FlyingAnimalParade';
import { AnimalData, getAnimalById, getFlyingAnimals, getGroundAnimals } from '@/data/AnimalDatabase';

const ACTIVE_HOME_PETS_KEY = 'petparadise-active-home-pets';
const SHOP_INVENTORY_KEY = 'petIsland_shopInventory';

interface RetroPixelPlatformProps {
  unlockedAnimals: string[]; // Animal names from XP system
  currentLevel: number;
  backgroundTheme?: string;
}

// Helper function to load active pets from localStorage
const loadActivePetsFromStorage = (): string[] => {
  const saved = localStorage.getItem(ACTIVE_HOME_PETS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : ['hare'];
    } catch {
      return ['hare'];
    }
  }
  return ['hare'];
};

// Helper function to load shop-purchased characters from localStorage
const loadShopOwnedCharacters = (): string[] => {
  const saved = localStorage.getItem(SHOP_INVENTORY_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed.ownedCharacters) ? parsed.ownedCharacters : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const RetroPixelPlatform = memo(({ unlockedAnimals: _unlockedAnimals, currentLevel, backgroundTheme = 'day' }: RetroPixelPlatformProps) => {
  // Initialize with localStorage value to avoid flash
  const [activeHomePets, setActiveHomePets] = useState<string[]>(() => loadActivePetsFromStorage());
  const [shopOwnedCharacters, setShopOwnedCharacters] = useState<string[]>(() => loadShopOwnedCharacters());

  // Listen for changes from collection page
  useEffect(() => {
    // Listen for changes from collection page via custom event
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      if (Array.isArray(customEvent.detail)) {
        setActiveHomePets(customEvent.detail);
      }
    };

    // Also listen for focus to re-sync from localStorage (fallback)
    const handleFocus = () => {
      setActiveHomePets(loadActivePetsFromStorage());
      setShopOwnedCharacters(loadShopOwnedCharacters());
    };

    // Also listen for storage events from other tabs
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVE_HOME_PETS_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed)) {
            setActiveHomePets(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
      if (event.key === SHOP_INVENTORY_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (Array.isArray(parsed.ownedCharacters)) {
            setShopOwnedCharacters(parsed.ownedCharacters);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    // Listen for shop updates (purchases)
    const handleShopUpdate = (event: CustomEvent) => {
      if (event.detail?.ownedCharacters) {
        setShopOwnedCharacters(event.detail.ownedCharacters);
      }
    };

    window.addEventListener('activeHomePetsChange', handleChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);

    return () => {
      window.removeEventListener('activeHomePetsChange', handleChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);
    };
  }, []);

  // Convert array to Set for O(1) lookups instead of O(n)
  const shopOwnedSet = useMemo(() => new Set(shopOwnedCharacters), [shopOwnedCharacters]);

  // Get active unlocked animals data
  // Check both level-based unlock AND shop purchase
  const activeAnimalData = useMemo(() => {
    return activeHomePets
      .map(id => getAnimalById(id))
      .filter((animal): animal is AnimalData =>
        animal !== undefined &&
        (animal.unlockLevel <= currentLevel || shopOwnedSet.has(animal.id)) &&
        animal.spriteConfig !== undefined
      );
  }, [activeHomePets, currentLevel, shopOwnedSet]);

  // Separate ground and flying animals
  const groundAnimals = useMemo(() => getGroundAnimals(activeAnimalData), [activeAnimalData]);
  const flyingAnimals = useMemo(() => getFlyingAnimals(activeAnimalData), [activeAnimalData]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layered Background */}
      <RetroBackground theme={backgroundTheme} />

      {/* Flying Animals in the sky */}
      <FlyingAnimalParade flyingAnimals={flyingAnimals} />

      {/* Platform Structure */}
      <PixelPlatform theme={backgroundTheme} />

      {/* Walking Animals on ground */}
      <AnimalParade unlockedAnimals={groundAnimals} />
    </div>
  );
});

RetroPixelPlatform.displayName = 'RetroPixelPlatform';
