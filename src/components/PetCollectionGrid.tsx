/**
 * PetCollectionGrid Component
 *
 * Main collection view with pets and worlds/backgrounds tabs.
 * Refactored to use smaller, focused child components for maintainability.
 *
 * Components extracted:
 * - WorldGrid: Biome selection
 * - BackgroundGrid: Premium backgrounds
 * - BackgroundDetailModal: Background purchase/equip modal
 */

import { useState, useMemo, useCallback, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BIOME_DATABASE } from "@/data/AnimalDatabase";
import { PREMIUM_BACKGROUNDS, PremiumBackground } from "@/data/ShopData";
import { toast } from "sonner";
import { CollectionFilters, PetSortOption } from "./collection/CollectionFilters";
import { PetCard } from "./collection/PetCard";
import { PetDetailModal } from "./collection/PetDetailModal";
import { WorldGrid } from "./collection/WorldGrid";
import { BackgroundGrid } from "./collection/BackgroundGrid";
import { BackgroundDetailModal } from "./collection/BackgroundDetailModal";
import { useShopStore, useThemeStore } from "@/stores";

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Forest': 'forest',
  'Snow': 'snow',
  'City': 'city',
  'Deep Ocean': 'deepocean',
};

// Memoized pet grid component for better performance
const PetGrid = memo(({
  pets,
  isAnimalUnlocked,
  isShopExclusive,
  isStudyHoursGated,
  isAnimalFavorite,
  isAnimalHomeActive,
  onPetClick,
}: {
  pets: AnimalData[];
  isAnimalUnlocked: (id: string) => boolean;
  isShopExclusive: (id: string) => boolean;
  isStudyHoursGated: (id: string) => boolean;
  isAnimalFavorite: (id: string) => boolean;
  isAnimalHomeActive: (id: string) => boolean;
  onPetClick: (pet: AnimalData) => void;
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {pets.map((pet) => (
        <PetCard
          key={pet.id}
          pet={pet}
          isLocked={!isAnimalUnlocked(pet.id)}
          isShopPet={isShopExclusive(pet.id)}
          isStudyHoursGated={isStudyHoursGated(pet.id)}
          isFavorited={isAnimalFavorite(pet.id)}
          isHomeActive={isAnimalHomeActive(pet.id)}
          onClick={() => onPetClick(pet)}
        />
      ))}
    </div>
  );
});

PetGrid.displayName = 'PetGrid';

export const PetCollectionGrid = memo(() => {
  const {
    currentLevel,
    currentBiome,
    switchBiome
  } = useAppStateTracking();

  const {
    stats,
    totalStudyHours,
    toggleFavorite,
    toggleHomeActive,
    isAnimalUnlocked,
    isAnimalFavorite,
    isAnimalHomeActive,
    isShopExclusive,
    isStudyHoursGated,
    filterAnimals
  } = useCollection();

  // Use Zustand stores instead of local state + events
  const ownedBackgrounds = useShopStore((state) => state.ownedBackgrounds);
  const equippedBackground = useShopStore((state) => state.equippedBackground);
  const setEquippedBackground = useShopStore((state) => state.setEquippedBackground);
  const setHomeBackground = useThemeStore((state) => state.setHomeBackground);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<PetSortOption>("default");
  const [selectedPet, setSelectedPet] = useState<AnimalData | null>(null);
  const [activeTab, setActiveTab] = useState<"pets" | "worlds">("pets");
  const [selectedBackground, setSelectedBackground] = useState<PremiumBackground | null>(null);

  // Handle equipping a background
  const handleEquipBackground = useCallback((bgId: string) => {
    const newEquipped = equippedBackground === bgId ? null : bgId;
    setEquippedBackground(newEquipped);

    if (newEquipped) {
      const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === bgId);
      const imagePath = background?.previewImage || 'day';
      setHomeBackground(imagePath);
      toast.success("Background equipped!");
    } else {
      setHomeBackground('day');
      toast.success("Background unequipped");
    }
  }, [equippedBackground, setEquippedBackground, setHomeBackground]);

  // Handle switching biomes
  const handleSwitchBiome = useCallback((biomeName: string) => {
    switchBiome(biomeName);

    // Clear any equipped premium background when switching biomes
    if (equippedBackground) {
      setEquippedBackground(null);
    }

    // Use the biome's background image if available
    const biome = BIOME_DATABASE.find(b => b.name === biomeName);
    const backgroundTheme = biome?.backgroundImage || BIOME_TO_BACKGROUND[biomeName] || 'day';
    setHomeBackground(backgroundTheme);
  }, [switchBiome, equippedBackground, setEquippedBackground, setHomeBackground]);

  // Handle navigation to shop tab (switches to shop and opens the pets category)
  const handleNavigateToShop = useCallback(() => {
    window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'shop' }));
    window.dispatchEvent(new CustomEvent('navigateToShopCategory', { detail: 'pets' }));
  }, []);

  // Memoize filtered and sorted pets
  const filteredPets = useMemo(() => {
    const pets = filterAnimals(searchQuery, "all", "all");

    if (sortOption === "default") return pets;

    const RARITY_RANK: Record<string, number> = {
      legendary: 0,
      epic: 1,
      rare: 2,
      common: 3,
    };

    return [...pets].sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rarity":
          return (RARITY_RANK[a.rarity] ?? 4) - (RARITY_RANK[b.rarity] ?? 4);
        case "owned": {
          const aOwned = isAnimalUnlocked(a.id) ? 0 : 1;
          const bOwned = isAnimalUnlocked(b.id) ? 0 : 1;
          return aOwned - bOwned;
        }
        case "favorites": {
          const aFav = isAnimalFavorite(a.id) ? 0 : 1;
          const bFav = isAnimalFavorite(b.id) ? 0 : 1;
          return aFav - bFav;
        }
        default:
          return 0;
      }
    });
  }, [searchQuery, sortOption, filterAnimals, isAnimalUnlocked, isAnimalFavorite]);

  // Memoize handler to avoid recreating on every render
  const handlePetClick = useCallback((pet: AnimalData) => {
    setSelectedPet(pet);
  }, []);

  // Memoize stats calculations
  const petsStats = useMemo(() => ({
    unlocked: stats.unlockedAnimals + stats.shopPetsOwned,
    total: stats.totalAnimals + stats.shopPetsTotal,
  }), [stats]);

  const worldsStats = useMemo(() => ({
    unlocked: BIOME_DATABASE.filter(b => b.unlockLevel <= currentLevel).length + ownedBackgrounds.length,
    total: BIOME_DATABASE.length + PREMIUM_BACKGROUNDS.length,
  }), [currentLevel, ownedBackgrounds.length]);

  // Handle background detail modal close
  const handleCloseBackgroundModal = useCallback(() => {
    setSelectedBackground(null);
  }, []);

  // Handle background equip from modal
  const handleEquipFromModal = useCallback(() => {
    if (selectedBackground) {
      handleEquipBackground(selectedBackground.id);
    }
  }, [selectedBackground, handleEquipBackground]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CollectionFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        petsStats={petsStats}
        worldsStats={worldsStats}
      />

      {/* Content - Scrollable area that stops at taskbar */}
      <ScrollArea className="flex-1 min-h-0">
        {activeTab === "pets" && (
          <div className="px-4 pt-2 pb-28">
            <PetGrid
              pets={filteredPets}
              isAnimalUnlocked={isAnimalUnlocked}
              isShopExclusive={isShopExclusive}
              isStudyHoursGated={isStudyHoursGated}
              isAnimalFavorite={isAnimalFavorite}
              isAnimalHomeActive={isAnimalHomeActive}
              onPetClick={handlePetClick}
            />
          </div>
        )}

        {activeTab === "worlds" && (
          <div className="px-4 pt-2 pb-28 space-y-4">
            {/* Biome Worlds Section */}
            <WorldGrid
              currentLevel={currentLevel}
              currentBiome={currentBiome}
              equippedBackground={equippedBackground}
              onSwitchBiome={handleSwitchBiome}
            />

            {/* Premium Backgrounds Section */}
            <BackgroundGrid
              ownedBackgrounds={ownedBackgrounds}
              equippedBackground={equippedBackground}
              onEquipBackground={handleEquipBackground}
              onSelectBackground={setSelectedBackground}
            />
          </div>
        )}
      </ScrollArea>

      {/* Background Detail Modal */}
      <BackgroundDetailModal
        background={selectedBackground}
        open={!!selectedBackground}
        onOpenChange={handleCloseBackgroundModal}
        isOwned={selectedBackground ? ownedBackgrounds.includes(selectedBackground.id) : false}
        isEquipped={selectedBackground?.id === equippedBackground}
        onEquip={handleEquipFromModal}
        onNavigateToShop={handleNavigateToShop}
      />

      {/* Pet Detail Modal */}
      <PetDetailModal
        pet={selectedPet}
        open={!!selectedPet}
        onOpenChange={() => setSelectedPet(null)}
        isUnlocked={selectedPet ? isAnimalUnlocked(selectedPet.id) : false}
        isShopExclusive={selectedPet ? isShopExclusive(selectedPet.id) : false}
        isStudyHoursGated={selectedPet ? isStudyHoursGated(selectedPet.id) : false}
        totalStudyHours={totalStudyHours}
        isFavorite={selectedPet ? isAnimalFavorite(selectedPet.id) : false}
        isHomeActive={selectedPet ? isAnimalHomeActive(selectedPet.id) : false}
        onToggleFavorite={() => selectedPet && toggleFavorite(selectedPet.id)}
        onToggleHomeActive={() => selectedPet && toggleHomeActive(selectedPet.id)}
        onNavigateToShop={() => {
          setSelectedPet(null);
          handleNavigateToShop();
        }}
      />
    </div>
  );
});

PetCollectionGrid.displayName = 'PetCollectionGrid';

export const AnimalCollection = PetCollectionGrid;
