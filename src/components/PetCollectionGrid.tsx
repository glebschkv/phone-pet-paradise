import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Star,
  Heart,
  Lock,
  Sparkles,
  Crown,
  TreePine,
  Waves,
  Mountain,
  Snowflake,
  MapPin,
  Check
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

const RARITY_COLORS = {
  common: "bg-slate-400",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-amber-500"
};

export const PetCollectionGrid = () => {
  const {
    currentLevel,
    currentBiome,
    switchBiome
  } = useAppStateTracking();

  const {
    stats,
    toggleFavorite,
    isAnimalUnlocked,
    isAnimalFavorite,
    filterAnimals
  } = useCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedPet, setSelectedPet] = useState<AnimalData | null>(null);
  const [activeTab, setActiveTab] = useState<"animals" | "biomes">("animals");

  const filteredPets = filterAnimals(searchQuery, selectedRarity, "all");

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="retro-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="retro-level-badge px-3 py-1.5 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="font-bold text-sm">Collection</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{stats.unlockedAnimals}</span>
            <span className="mx-1">/</span>
            <span>{stats.totalAnimals}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("animals")}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95",
              activeTab === "animals"
                ? "retro-level-badge"
                : "retro-stat-pill"
            )}
          >
            Pets
          </button>
          <button
            onClick={() => setActiveTab("biomes")}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95",
              activeTab === "biomes"
                ? "retro-level-badge"
                : "retro-stat-pill"
            )}
          >
            Worlds
          </button>
        </div>
      </div>

      {activeTab === "animals" && (
        <div className="px-4 mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-2 border-border rounded-xl"
            />
          </div>

          {/* Rarity Filter */}
          <div className="flex gap-2">
            {["all", "common", "rare", "epic", "legendary"].map((rarity) => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(rarity)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 capitalize",
                  selectedRarity === rarity
                    ? "retro-level-badge"
                    : "retro-stat-pill"
                )}
              >
                {rarity === "all" ? "All" : rarity}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-4 gap-2">
            {filteredPets.map((pet) => {
              const isLocked = !isAnimalUnlocked(pet.id);
              const isFavorited = isAnimalFavorite(pet.id);

              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={cn(
                    "retro-card p-2 aspect-square flex flex-col items-center justify-center relative transition-all active:scale-95",
                    isLocked && "opacity-50"
                  )}
                >
                  {/* Collected checkmark */}
                  {!isLocked && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}

                  {/* Favorite heart */}
                  {!isLocked && isFavorited && (
                    <div className="absolute top-1 left-1">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </div>
                  )}

                  {/* Emoji or Lock */}
                  <div className="text-2xl mb-1">
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      pet.emoji
                    )}
                  </div>

                  {/* Rarity dot */}
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    RARITY_COLORS[pet.rarity]
                  )} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "biomes" && (
        <div className="px-4 mt-4 space-y-3">
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
                          isActive ? 'Currently exploring' : `Level ${biome.unlockLevel}+`
                        ) : (
                          `Unlock at Lv.${biome.unlockLevel}`
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnlocked && !isActive && (
                    <button
                      onClick={() => switchBiome(biome.name)}
                      className="retro-stat-pill px-4 py-2 text-sm font-semibold active:scale-95 transition-all"
                    >
                      Visit
                    </button>
                  )}

                  {isActive && (
                    <div className="retro-level-badge px-3 py-1.5 text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
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
              {/* Header */}
              <div className="p-6 text-center bg-card">
                <div className="text-5xl mb-3">
                  {isAnimalUnlocked(selectedPet.id) ? selectedPet.emoji : "❓"}
                </div>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">
                    {isAnimalUnlocked(selectedPet.id) ? selectedPet.name : "???"}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    RARITY_COLORS[selectedPet.rarity]
                  )} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedPet.rarity}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {isAnimalUnlocked(selectedPet.id) ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedPet.description}
                    </p>

                    <div className="retro-stat-pill p-3">
                      <div className="text-xs text-muted-foreground mb-2">Abilities</div>
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
                      {isAnimalFavorite(selectedPet.id) ? "Favorited" : "Add Favorite"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Locked
                    </p>
                    <div className="retro-level-badge inline-block px-4 py-2 text-sm">
                      Reach Lv.{selectedPet.unlockLevel}
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
