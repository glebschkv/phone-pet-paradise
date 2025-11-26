import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Star,
  Heart,
  Lock,
  Sparkles,
  Trophy,
  Crown,
  TreePine,
  Waves,
  Mountain,
  Snowflake,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BIOME_DATABASE } from "@/data/AnimalDatabase";

const BIOME_ICONS = {
  'Meadow': TreePine,
  'Forest': TreePine,
  'Ocean': Waves,
  'Mountains': Mountain,
  'Tundra': Snowflake,
};

const RARITY_STYLES = {
  common: {
    bg: "bg-gradient-to-b from-slate-100 to-slate-200",
    border: "border-slate-300",
    text: "text-slate-600",
    glow: ""
  },
  rare: {
    bg: "bg-gradient-to-b from-blue-100 to-blue-200",
    border: "border-blue-400",
    text: "text-blue-600",
    glow: "shadow-[0_0_10px_rgba(59,130,246,0.3)]"
  },
  epic: {
    bg: "bg-gradient-to-b from-purple-100 to-purple-200",
    border: "border-purple-400",
    text: "text-purple-600",
    glow: "shadow-[0_0_12px_rgba(147,51,234,0.4)]"
  },
  legendary: {
    bg: "bg-gradient-to-b from-amber-100 to-orange-200",
    border: "border-amber-400",
    text: "text-amber-700",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]"
  }
};

export const PetCollectionGrid = () => {
  const {
    currentLevel,
    currentBiome,
    switchBiome
  } = useAppStateTracking();

  const {
    allAnimals,
    stats,
    toggleFavorite,
    isAnimalUnlocked,
    isAnimalFavorite,
    filterAnimals
  } = useCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedBiome, setSelectedBiome] = useState<string>("all");
  const [selectedPet, setSelectedPet] = useState<AnimalData | null>(null);
  const [activeTab, setActiveTab] = useState<"animals" | "biomes">("animals");

  const filteredPets = filterAnimals(searchQuery, selectedRarity, selectedBiome);

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Sparkles className="w-3.5 h-3.5" />;
      case 'epic': return <Trophy className="w-3.5 h-3.5" />;
      case 'rare': return <Star className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="retro-level-badge px-3 py-1.5 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="font-bold">Collection</span>
            </div>
          </div>
          <div className="retro-stat-pill px-3 py-1.5 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-bold">{stats.unlockedAnimals}/{stats.totalAnimals}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("animals")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all",
              activeTab === "animals"
                ? "retro-level-badge"
                : "retro-stat-pill hover:brightness-95"
            )}
          >
            Animals
          </button>
          <button
            onClick={() => setActiveTab("biomes")}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all",
              activeTab === "biomes"
                ? "retro-level-badge"
                : "retro-stat-pill hover:brightness-95"
            )}
          >
            Worlds
          </button>
        </div>
      </div>

      {activeTab === "animals" && (
        <>
          {/* Search & Filters */}
          <div className="retro-card p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search animals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-2 border-border"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "common", "rare", "epic", "legendary"].map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize",
                    selectedRarity === rarity
                      ? "retro-level-badge"
                      : "retro-stat-pill hover:brightness-95"
                  )}
                >
                  {rarity === "all" ? "All" : rarity}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredPets.map((pet) => {
              const isLocked = !isAnimalUnlocked(pet.id);
              const canUnlock = currentLevel >= pet.unlockLevel;
              const isFavorited = isAnimalFavorite(pet.id);
              const style = RARITY_STYLES[pet.rarity];

              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all active:scale-95 touch-manipulation text-left",
                    isLocked && !canUnlock && "opacity-40",
                    style.bg,
                    style.border,
                    !isLocked && style.glow,
                    "hover:brightness-105"
                  )}
                  style={{
                    boxShadow: !isLocked ? undefined : undefined
                  }}
                >
                  {/* Favorite indicator */}
                  {!isLocked && isFavorited && (
                    <div className="absolute top-1 right-1">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </div>
                  )}

                  {/* Rarity indicator */}
                  {!isLocked && getRarityIcon(pet.rarity) && (
                    <div className={cn("absolute top-1 left-1", style.text)}>
                      {getRarityIcon(pet.rarity)}
                    </div>
                  )}

                  {/* Pet content */}
                  <div className="text-center pt-2">
                    <div className="text-3xl mb-1">
                      {isLocked ? (
                        <Lock className="w-6 h-6 mx-auto text-muted-foreground" />
                      ) : (
                        pet.emoji
                      )}
                    </div>

                    <h3 className="font-bold text-xs truncate">
                      {isLocked ? "???" : pet.name}
                    </h3>

                    {/* Unlock requirement */}
                    {isLocked && (
                      <div className="mt-1">
                        {canUnlock ? (
                          <span className="text-[10px] font-semibold text-green-600">Ready!</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Lv.{pet.unlockLevel}</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "biomes" && (
        <div className="space-y-3">
          {BIOME_DATABASE.map((biome) => {
            const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || TreePine;
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
                      "w-10 h-10 rounded-lg flex items-center justify-center",
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
                          isActive ? 'Currently exploring' : biome.description
                        ) : (
                          `Unlocks at Level ${biome.unlockLevel}`
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnlocked && !isActive && (
                    <button
                      onClick={() => switchBiome(biome.name)}
                      className="retro-stat-pill px-4 py-2 text-sm font-semibold hover:brightness-95 active:scale-95 transition-all"
                    >
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Go
                    </button>
                  )}

                  {isActive && (
                    <div className="retro-level-badge px-3 py-1.5 text-xs font-bold">
                      Active
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
        <DialogContent className="max-w-sm retro-card border-2 border-border p-0 overflow-hidden">
          {selectedPet && (
            <>
              {/* Header */}
              <div className={cn(
                "p-6 text-center",
                RARITY_STYLES[selectedPet.rarity].bg
              )}>
                <div className="text-5xl mb-2">
                  {isAnimalUnlocked(selectedPet.id) ? selectedPet.emoji : "❓"}
                </div>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-center gap-2 text-lg">
                    {isAnimalUnlocked(selectedPet.id) ? selectedPet.name : "???"}
                    <span className={RARITY_STYLES[selectedPet.rarity].text}>
                      {getRarityIcon(selectedPet.rarity)}
                    </span>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="p-5 space-y-4">
                {isAnimalUnlocked(selectedPet.id) ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedPet.description}
                    </p>

                    <div className="retro-stat-pill p-3">
                      <h4 className="font-bold text-xs mb-2 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Abilities
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPet.abilities.map((ability, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary"
                          >
                            {ability}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="retro-stat-pill flex-1 p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Biome</div>
                        <div className="text-sm font-bold">{selectedPet.biome}</div>
                      </div>
                      <div className="retro-stat-pill flex-1 p-3 text-center">
                        <div className="text-xs text-muted-foreground mb-1">Rarity</div>
                        <div className={cn("text-sm font-bold capitalize", RARITY_STYLES[selectedPet.rarity].text)}>
                          {selectedPet.rarity}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(selectedPet.id)}
                      className={cn(
                        "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                        isAnimalFavorite(selectedPet.id)
                          ? "bg-red-100 text-red-600 border-2 border-red-300"
                          : "retro-stat-pill hover:brightness-95"
                      )}
                    >
                      <Heart className={cn(
                        "w-4 h-4 inline mr-2",
                        isAnimalFavorite(selectedPet.id) && "fill-red-500"
                      )} />
                      {isAnimalFavorite(selectedPet.id) ? "Remove Favorite" : "Add to Favorites"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 retro-stat-pill rounded-full flex items-center justify-center">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      This animal is locked
                    </p>
                    <div className="retro-level-badge inline-block px-4 py-2 text-sm">
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
