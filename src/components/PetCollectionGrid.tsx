import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Heart,
  Lock,
  TreePine,
  Snowflake,
  MapPin,
  Star,
  Sun,
  Sunset,
  Moon,
  Home,
  Building2,
  Columns,
  Waves,
  ShoppingBag,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BIOME_DATABASE } from "@/data/AnimalDatabase";

// Animated sprite preview component for collection
const SpritePreview = ({ animal, scale = 4 }: { animal: AnimalData; scale?: number }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);
  const spriteConfig = animal.spriteConfig;

  useEffect(() => {
    if (!spriteConfig) return;

    const { frameCount, animationSpeed = 10 } = spriteConfig;
    const frameDuration = 1000 / animationSpeed;

    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= frameDuration) {
        setCurrentFrame(prev => (prev + 1) % frameCount);
        frameTimeRef.current = 0;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [spriteConfig]);

  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, frameRow = 0 } = spriteConfig;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const backgroundPositionX = -(currentFrame * frameWidth * scale);
  const backgroundPositionY = -(frameRow * frameHeight * scale);

  return (
    <div
      className="mx-auto"
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        backgroundImage: `url(${spritePath})`,
        backgroundSize: `${frameCount * scaledWidth}px auto`,
        backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
};

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

const RARITY_STARS = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
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

  // When switching biomes, also update the background
  const handleSwitchBiome = (biomeName: string) => {
    switchBiome(biomeName);
    // Update background to match the biome
    const backgroundId = BIOME_TO_BACKGROUND[biomeName] || 'day';
    localStorage.setItem(HOME_BACKGROUND_KEY, backgroundId);
    window.dispatchEvent(new CustomEvent('homeBackgroundChange', { detail: backgroundId }));
  };

  const filteredPets = filterAnimals(searchQuery, "all", "all");

  return (
    <div className="h-full flex flex-col" style={{
      background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
    }}>
      {/* Header */}
      <div className="retro-card mx-3 mt-3 overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab("pets")}
            className={cn(
              "flex-1 py-3 text-center font-bold text-sm transition-all",
              activeTab === "pets"
                ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-b-2 border-amber-500"
                : "text-muted-foreground hover:bg-muted/30"
            )}
          >
            <div>PETS</div>
            <div className="text-xs font-medium opacity-80">
              {stats.unlockedAnimals + stats.shopPetsOwned}/{stats.totalAnimals + stats.shopPetsTotal}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("worlds")}
            className={cn(
              "flex-1 py-3 text-center font-bold text-sm transition-all",
              activeTab === "worlds"
                ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-b-2 border-amber-500"
                : "text-muted-foreground hover:bg-muted/30"
            )}
          >
            <div>WORLDS</div>
            <div className="text-xs font-medium opacity-80">{BIOME_DATABASE.filter(b => b.unlockLevel <= currentLevel).length}/{BIOME_DATABASE.length}</div>
          </button>
        </div>

        {/* Search */}
        {activeTab === "pets" && (
          <div className="p-3 border-t border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background/50 border-2 border-border rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

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
                const stars = RARITY_STARS[pet.rarity];
                const isHomeActive = isAnimalHomeActive(pet.id);

                // Shop pets show differently - not really "locked", just purchasable
                const showAsLocked = isLocked && !isShopPet;
                const showAsShopPet = isLocked && isShopPet;

                return (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={cn(
                      "rounded-lg p-3 flex flex-col items-center relative transition-all active:scale-95",
                      showAsLocked ? "bg-muted/50" :
                      showAsShopPet ? "bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" :
                      "bg-card"
                    )}
                    style={{
                      border: showAsShopPet
                        ? '2px solid hsl(35 80% 60%)'
                        : '2px solid hsl(var(--border))',
                      boxShadow: showAsLocked
                        ? 'none'
                        : '0 3px 0 hsl(var(--border) / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    }}
                  >
                    {/* Favorite heart */}
                    {!isLocked && isFavorited && (
                      <div className="absolute top-1.5 left-1.5">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </div>
                    )}

                    {/* Home active indicator */}
                    {!isLocked && isHomeActive && (
                      <div className="absolute top-1.5 right-1.5">
                        <Home className="w-4 h-4 text-green-500 fill-green-500/30" />
                      </div>
                    )}

                    {/* Level badge for locked (non-shop) */}
                    {showAsLocked && (
                      <div className="absolute top-1.5 right-1.5 retro-stat-pill px-1.5 py-0.5">
                        <span className="text-[9px] font-bold">Lv.{pet.unlockLevel}</span>
                      </div>
                    )}

                    {/* Shop badge for shop-exclusive pets */}
                    {showAsShopPet && (
                      <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-bold">SHOP</span>
                      </div>
                    )}

                    {/* Sprite or Lock */}
                    <div className={cn(
                      "mb-1.5 h-12 flex items-center justify-center overflow-hidden",
                      showAsLocked && "opacity-30 grayscale"
                    )}>
                      {showAsLocked ? (
                        <Lock className="w-7 h-7 text-muted-foreground" />
                      ) : pet.spriteConfig ? (
                        <SpritePreview
                          animal={pet}
                          scale={Math.min(1.5, 48 / pet.spriteConfig.frameHeight)}
                        />
                      ) : (
                        <span className="text-4xl">{pet.emoji}</span>
                      )}
                    </div>

                    {/* Stars for rarity */}
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(stars)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            showAsLocked
                              ? "text-muted-foreground/40"
                              : "text-amber-400 fill-amber-400"
                          )}
                        />
                      ))}
                    </div>

                    {/* Name */}
                    <span className={cn(
                      "text-[11px] font-semibold truncate w-full text-center",
                      showAsLocked ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {showAsLocked ? "???" : pet.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "worlds" && (
          <div className="px-3 pt-3 pb-6 space-y-2">
            {BIOME_DATABASE.map((biome) => {
              const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || Sun;
              const isActive = biome.name === currentBiome;
              const isUnlocked = biome.unlockLevel <= currentLevel;

              return (
                <div
                  key={biome.name}
                  className={cn(
                    "retro-card p-4 transition-all",
                    isActive && "ring-2 ring-primary",
                    !isUnlocked && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-lg flex items-center justify-center",
                        isActive ? "retro-level-badge" : "retro-stat-pill"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">
                          {isUnlocked ? biome.name : "???"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isUnlocked ? (
                            isActive ? 'Currently here' : `Level ${biome.unlockLevel}+`
                          ) : (
                            `Unlock at Lv.${biome.unlockLevel}`
                          )}
                        </div>
                      </div>
                    </div>

                    {isUnlocked && !isActive && (
                      <button
                        onClick={() => handleSwitchBiome(biome.name)}
                        className="retro-stat-pill px-4 py-2 text-sm font-semibold active:scale-95 transition-all"
                      >
                        Visit
                      </button>
                    )}

                    {isActive && (
                      <div className="retro-level-badge px-3 py-1.5 text-xs font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Pet Detail Modal */}
      <Dialog open={!!selectedPet} onOpenChange={() => setSelectedPet(null)}>
        <DialogContent className="max-w-xs retro-card border-2 border-border p-0 overflow-hidden">
          {selectedPet && (
            <>
              {/* Header with sprite animation */}
              <div className="p-6 text-center" style={{
                background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
              }}>
                {/* Show animated sprite for unlocked pets, emoji for locked */}
                {isAnimalUnlocked(selectedPet.id) && selectedPet.spriteConfig ? (
                  <div className="mb-3 flex items-center justify-center h-[180px] overflow-hidden">
                    <SpritePreview
                      animal={selectedPet}
                      scale={Math.min(4, 180 / Math.max(selectedPet.spriteConfig.frameWidth, selectedPet.spriteConfig.frameHeight))}
                    />
                  </div>
                ) : (
                  <div className="text-5xl mb-3">
                    {isAnimalUnlocked(selectedPet.id) ? selectedPet.emoji : "❓"}
                  </div>
                )}

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(RARITY_STARS[selectedPet.rarity])].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>

                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">
                    {isAnimalUnlocked(selectedPet.id) ? selectedPet.name : "???"}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="retro-stat-pill px-2 py-0.5 text-[10px] font-semibold capitalize">
                    {selectedPet.rarity}
                  </span>
                  <span className="retro-stat-pill px-2 py-0.5 text-[10px] font-semibold">
                    {selectedPet.biome}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {isAnimalUnlocked(selectedPet.id) ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedPet.description}
                    </p>

                    {/* Show on Home toggle */}
                    <button
                      onClick={() => toggleHomeActive(selectedPet.id)}
                      className={cn(
                        "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                        isAnimalHomeActive(selectedPet.id)
                          ? "bg-green-100 text-green-700 border-2 border-green-300"
                          : "retro-stat-pill"
                      )}
                    >
                      <Home className={cn(
                        "w-4 h-4 inline mr-2",
                        isAnimalHomeActive(selectedPet.id) && "fill-green-500/50"
                      )} />
                      {isAnimalHomeActive(selectedPet.id) ? "Showing on Home" : "Show on Home"}
                    </button>

                    {/* Favorite toggle */}
                    <button
                      onClick={() => toggleFavorite(selectedPet.id)}
                      className={cn(
                        "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                        isAnimalFavorite(selectedPet.id)
                          ? "bg-red-100 text-red-600 border-2 border-red-200"
                          : "retro-stat-pill"
                      )}
                    >
                      <Heart className={cn(
                        "w-4 h-4 inline mr-2",
                        isAnimalFavorite(selectedPet.id) && "fill-red-500"
                      )} />
                      {isAnimalFavorite(selectedPet.id) ? "Favorited" : "Add to Favorites"}
                    </button>
                  </>
                ) : isShopExclusive(selectedPet.id) ? (
                  // Shop-exclusive pet that isn't purchased yet
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedPet.description}
                    </p>
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center border-2 border-amber-300">
                      <ShoppingBag className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      This pet is available in the Shop
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-3 text-amber-600 dark:text-amber-400">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{selectedPet.coinPrice?.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPet(null);
                        // Dispatch event to switch to shop tab
                        window.dispatchEvent(new CustomEvent('switchToTab', { detail: 'shop' }));
                      }}
                      className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Buy from Shop
                    </button>
                  </div>
                ) : (
                  // Level-locked pet
                  <div className="text-center py-4">
                    <div className="w-14 h-14 mx-auto mb-3 retro-stat-pill rounded-full flex items-center justify-center">
                      <Lock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      This pet is locked
                    </p>
                    <div className="retro-level-badge inline-block px-4 py-2 text-sm font-bold">
                      Reach Level {selectedPet.unlockLevel}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const AnimalCollection = PetCollectionGrid;
