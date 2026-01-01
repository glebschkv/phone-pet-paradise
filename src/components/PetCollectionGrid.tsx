import { useState, useEffect } from "react";
import { collectionLogger } from "@/lib/logger";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TreePine,
  Snowflake,
  MapPin,
  Sun,
  Sunset,
  Moon,
  Building2,
  Columns,
  Waves,
  ShoppingBag,
  Coins,
  Image,
  Check,
  Palette,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BIOME_DATABASE } from "@/data/AnimalDatabase";
import { PREMIUM_BACKGROUNDS, PremiumBackground } from "@/data/ShopData";
import { toast } from "sonner";
import { CollectionFilters } from "./collection/CollectionFilters";
import { PetCard } from "./collection/PetCard";
import { PetDetailModal } from "./collection/PetDetailModal";

const SHOP_INVENTORY_KEY = 'petIsland_shopInventory';

// Biome icons match background themes
const BIOME_ICONS = {
  'Meadow': Sun,
  'Sunset': Sunset,
  'Night': Moon,
  'Forest': TreePine,
  'Snow': Snowflake,
  'City': Building2,
  'Ruins': Columns,
  'Deep Ocean': Waves,
};

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Forest': 'forest',
  'Snow': 'snow',
  'City': 'city',
  'Ruins': 'ruins',
  'Deep Ocean': 'deepocean',
};

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

export const PetCollectionGrid = () => {
  const {
    currentLevel,
    currentBiome,
    switchBiome
  } = useAppStateTracking();

  const {
    stats,
    toggleFavorite,
    toggleHomeActive,
    isAnimalUnlocked,
    isAnimalFavorite,
    isAnimalHomeActive,
    isShopExclusive,
    filterAnimals
  } = useCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPet, setSelectedPet] = useState<AnimalData | null>(null);
  const [activeTab, setActiveTab] = useState<"pets" | "worlds">("pets");
  const [selectedBackground, setSelectedBackground] = useState<PremiumBackground | null>(null);

  // Shop inventory state for backgrounds
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<string[]>([]);
  const [equippedBackground, setEquippedBackground] = useState<string | null>(null);

  // Load shop inventory
  useEffect(() => {
    const loadShopInventory = () => {
      const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setOwnedBackgrounds(parsed.ownedBackgrounds || []);
          setEquippedBackground(parsed.equippedBackground || null);
        } catch (error) {
          collectionLogger.error('Failed to load shop inventory:', error);
        }
      }
    };

    loadShopInventory();

    // Listen for shop updates
    const handleShopUpdate = (event: CustomEvent) => {
      if (event.detail) {
        setOwnedBackgrounds(event.detail.ownedBackgrounds || []);
        setEquippedBackground(event.detail.equippedBackground || null);
      }
    };

    window.addEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);
    return () => {
      window.removeEventListener('petIsland_shopUpdate', handleShopUpdate as EventListener);
    };
  }, []);

  // Handle equipping a background
  const handleEquipBackground = (bgId: string) => {
    const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const newEquipped = parsed.equippedBackground === bgId ? null : bgId;
        const newInventory = {
          ...parsed,
          equippedBackground: newEquipped,
        };
        localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify(newInventory));
        setEquippedBackground(newEquipped);

        // Dispatch event for home screen and shop to pick up
        window.dispatchEvent(new CustomEvent('petIsland_shopUpdate', { detail: newInventory }));

        // Also update the home background
        if (newEquipped) {
          const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === bgId);
          const imagePath = background?.previewImage || 'day';
          window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: imagePath }));
          toast.success("Background equipped!");
        } else {
          window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: 'day' }));
          toast.success("Background unequipped");
        }
      } catch (error) {
        collectionLogger.error('Failed to update shop inventory:', error);
      }
    }
  };

  // When switching biomes, also update the background and clear any equipped premium background
  const handleSwitchBiome = (biomeName: string) => {
    switchBiome(biomeName);

    // Clear any equipped premium background when switching biomes
    const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.equippedBackground) {
          const newInventory = {
            ...parsed,
            equippedBackground: null,
          };
          localStorage.setItem(SHOP_INVENTORY_KEY, JSON.stringify(newInventory));
          setEquippedBackground(null);
          window.dispatchEvent(new CustomEvent('petIsland_shopUpdate', { detail: newInventory }));
        }
      } catch (error) {
        collectionLogger.error('Failed to update shop inventory:', error);
      }
    }

    // Use the biome's background image if available, otherwise fall back to theme ID
    const biome = BIOME_DATABASE.find(b => b.name === biomeName);
    const backgroundTheme = biome?.backgroundImage || BIOME_TO_BACKGROUND[biomeName] || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundTheme);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundTheme }));
  };

  const filteredPets = filterAnimals(searchQuery, "all", "all");

  return (
    <div className="h-full flex flex-col" style={{
      background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
    }}>
      {/* Header */}
      <CollectionFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        petsStats={{
          unlocked: stats.unlockedAnimals + stats.shopPetsOwned,
          total: stats.totalAnimals + stats.shopPetsTotal,
        }}
        worldsStats={{
          unlocked: BIOME_DATABASE.filter(b => b.unlockLevel <= currentLevel).length + ownedBackgrounds.length,
          total: BIOME_DATABASE.length + PREMIUM_BACKGROUNDS.length,
        }}
      />

      {/* Content - Scrollable area that stops at taskbar */}
      <ScrollArea className="flex-1 min-h-0">
        {activeTab === "pets" && (
          <div className="px-3 pt-3 pb-6">
            {/* Grid */}
            <div className="grid grid-cols-3 gap-2">
              {filteredPets.map((pet) => {
                const isLocked = !isAnimalUnlocked(pet.id);
                const isShopPet = isShopExclusive(pet.id);
                const isFavorited = isAnimalFavorite(pet.id);
                const isHomeActive = isAnimalHomeActive(pet.id);

                return (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    isLocked={isLocked}
                    isShopPet={isShopPet}
                    isFavorited={isFavorited}
                    isHomeActive={isHomeActive}
                    onClick={() => setSelectedPet(pet)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "worlds" && (
          <div className="px-3 pt-3 pb-6 space-y-4">
            {/* Biome Worlds Section */}
            <div className="space-y-2">
              {BIOME_DATABASE.map((biome) => {
                const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || Sun;
                const isActive = biome.name === currentBiome && !equippedBackground;
                const isUnlocked = biome.unlockLevel <= currentLevel;

                return (
                  <button
                    key={biome.name}
                    onClick={() => isUnlocked && handleSwitchBiome(biome.name)}
                    disabled={!isUnlocked}
                    className={cn(
                      "w-full retro-card overflow-hidden transition-all active:scale-[0.98]",
                      isActive && "ring-2 ring-green-400",
                      !isUnlocked && "opacity-50"
                    )}
                  >
                    <div className="flex items-stretch">
                      {/* Preview Image */}
                      <div className="w-20 h-16 flex-shrink-0 bg-muted overflow-hidden">
                        {biome.backgroundImage && isUnlocked ? (
                          <img
                            src={biome.backgroundImage}
                            alt={biome.name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            {isUnlocked ? (
                              <Icon className="w-6 h-6 text-muted-foreground" />
                            ) : (
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 flex items-center justify-between px-3 py-2">
                        <div className="text-left">
                          <div className="font-bold text-sm">
                            {isUnlocked ? biome.name : "???"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isUnlocked ? (
                              isActive ? 'Currently here' : `Level ${biome.unlockLevel}+`
                            ) : (
                              `Unlock at Lv.${biome.unlockLevel}`
                            )}
                          </div>
                        </div>

                        {isUnlocked && (
                          isActive ? (
                            <div className="retro-level-badge px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Here
                            </div>
                          ) : (
                            <div className="retro-stat-pill px-3 py-1 text-xs font-semibold">
                              Visit
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Premium Backgrounds Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Image className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Shop Backgrounds</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PREMIUM_BACKGROUNDS.map((bg) => {
                  const owned = ownedBackgrounds.includes(bg.id);
                  const isEquipped = equippedBackground === bg.id;

                  return (
                    <button
                      key={bg.id}
                      onClick={() => {
                        if (owned) {
                          handleEquipBackground(bg.id);
                        } else {
                          setSelectedBackground(bg);
                        }
                      }}
                      className={cn(
                        "relative rounded-xl border-2 overflow-hidden transition-all active:scale-95",
                        isEquipped
                          ? "border-purple-400 ring-2 ring-purple-300"
                          : owned
                          ? "border-green-400"
                          : "border-border"
                      )}
                    >
                      {/* Background Preview */}
                      <div className="relative h-20 overflow-hidden bg-muted">
                        {bg.previewImage ? (
                          <img
                            src={bg.previewImage}
                            alt={bg.name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {bg.icon}
                          </div>
                        )}

                        {/* Status overlay */}
                        {isEquipped && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                            <div className="bg-purple-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                              <Palette className="w-3 h-3 text-white" />
                              <span className="text-[10px] font-bold text-white">EQUIPPED</span>
                            </div>
                          </div>
                        )}
                        {owned && !isEquipped && (
                          <div className="absolute top-1 right-1">
                            <div className="bg-green-500 rounded-full p-0.5">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        {!owned && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              <span className="text-[9px] font-bold">SHOP</span>
                            </div>
                          </div>
                        )}

                        {/* Rarity dot */}
                        <div className={cn(
                          "absolute top-1 left-1 h-2 w-2 rounded-full",
                          bg.rarity === 'legendary' ? "bg-amber-400" :
                          bg.rarity === 'epic' ? "bg-purple-400" :
                          bg.rarity === 'rare' ? "bg-blue-400" : "bg-gray-400"
                        )} />
                      </div>

                      {/* Info */}
                      <div className={cn(
                        "p-2 text-left",
                        isEquipped ? "bg-purple-50 dark:bg-purple-900/20" :
                        owned ? "bg-green-50 dark:bg-green-900/20" : "bg-card"
                      )}>
                        <span className="text-[11px] font-bold block leading-tight truncate">{bg.name}</span>
                        {owned ? (
                          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">
                            {isEquipped ? "Tap to unequip" : "Tap to equip"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-0.5 text-[9px] text-amber-600">
                            <Coins className="w-2.5 h-2.5" />
                            <span className="font-bold">{bg.coinPrice?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Background Detail Modal */}
      <Dialog open={!!selectedBackground} onOpenChange={() => setSelectedBackground(null)}>
        <DialogContent className="max-w-xs retro-card border-2 border-border p-0 overflow-hidden">
          {selectedBackground && (
            <>
              <div className="relative h-36 overflow-hidden">
                {selectedBackground.previewImage ? (
                  <img
                    src={selectedBackground.previewImage}
                    alt={selectedBackground.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-muted">
                    {selectedBackground.icon}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{selectedBackground.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      selectedBackground.rarity === 'legendary' ? "bg-amber-400 text-amber-900" :
                      selectedBackground.rarity === 'epic' ? "bg-purple-400 text-purple-900" :
                      selectedBackground.rarity === 'rare' ? "bg-blue-400 text-blue-900" : "bg-gray-400 text-gray-900"
                    )}>
                      {selectedBackground.rarity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {selectedBackground.description}
                </p>

                {ownedBackgrounds.includes(selectedBackground.id) ? (
                  <button
                    onClick={() => {
                      handleEquipBackground(selectedBackground.id);
                      setSelectedBackground(null);
                    }}
                    className={cn(
                      "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                      equippedBackground === selectedBackground.id
                        ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                        : "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                    )}
                  >
                    <Palette className="w-4 h-4 inline mr-2" />
                    {equippedBackground === selectedBackground.id ? "Unequip" : "Equip Background"}
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center border-2 border-amber-300">
                      <ShoppingBag className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Purchase this background from the Shop
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-3 text-amber-600">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{selectedBackground.coinPrice?.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBackground(null);
                        window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'shop' }));
                      }}
                      className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy from Shop
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pet Detail Modal */}
      <PetDetailModal
        pet={selectedPet}
        open={!!selectedPet}
        onOpenChange={() => setSelectedPet(null)}
        isUnlocked={selectedPet ? isAnimalUnlocked(selectedPet.id) : false}
        isShopExclusive={selectedPet ? isShopExclusive(selectedPet.id) : false}
        isFavorite={selectedPet ? isAnimalFavorite(selectedPet.id) : false}
        isHomeActive={selectedPet ? isAnimalHomeActive(selectedPet.id) : false}
        onToggleFavorite={() => selectedPet && toggleFavorite(selectedPet.id)}
        onToggleHomeActive={() => selectedPet && toggleHomeActive(selectedPet.id)}
        onNavigateToShop={() => {
          setSelectedPet(null);
          window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'shop' }));
        }}
      />
    </div>
  );
};

export const AnimalCollection = PetCollectionGrid;
