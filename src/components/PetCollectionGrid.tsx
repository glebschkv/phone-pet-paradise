import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BIOME_DATABASE } from "@/data/AnimalDatabase";

// Animated sprite preview component for collection modal
const SpritePreview = ({ animal }: { animal: AnimalData }) => {
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
  const scale = 4; // Larger scale for close-up view
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
};

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Forest': 'forest',
  'Snow': 'snow',
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
    <div className="min-h-screen pb-24" style={{
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
            <div className="text-xs font-medium opacity-80">{stats.unlockedAnimals}/{stats.totalAnimals}</div>
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

      {activeTab === "pets" && (
        <div className="px-3 pt-3">
          {/* Grid */}
          <div className="grid grid-cols-3 gap-2">
            {filteredPets.map((pet) => {
              const isLocked = !isAnimalUnlocked(pet.id);
              const isFavorited = isAnimalFavorite(pet.id);
              const stars = RARITY_STARS[pet.rarity];

              const isHomeActive = isAnimalHomeActive(pet.id);

              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={cn(
                    "rounded-lg p-3 flex flex-col items-center relative transition-all active:scale-95",
                    isLocked ? "bg-muted/50" : "bg-card"
                  )}
                  style={{
                    border: '2px solid hsl(var(--border))',
                    boxShadow: isLocked
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

                  {/* Level badge for locked */}
                  {isLocked && (
                    <div className="absolute top-1.5 right-1.5 retro-stat-pill px-1.5 py-0.5">
                      <span className="text-[9px] font-bold">Lv.{pet.unlockLevel}</span>
                    </div>
                  )}

                  {/* Emoji or Lock */}
                  <div className={cn(
                    "text-4xl mb-1.5 h-11 flex items-center justify-center",
                    isLocked && "opacity-30 grayscale"
                  )}>
                    {isLocked ? (
                      <Lock className="w-7 h-7 text-muted-foreground" />
                    ) : (
                      pet.emoji
                    )}
                  </div>

                  {/* Stars for rarity */}
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(stars)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          isLocked
                            ? "text-muted-foreground/40"
                            : "text-amber-400 fill-amber-400"
                        )}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <span className={cn(
                    "text-[11px] font-semibold truncate w-full text-center",
                    isLocked ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {isLocked ? "???" : pet.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "worlds" && (
        <div className="px-3 pt-3 space-y-2">
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
                  <div className="mb-3 flex items-center justify-center min-h-[100px]">
                    <SpritePreview animal={selectedPet} />
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
                ) : (
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
