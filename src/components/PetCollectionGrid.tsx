import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  Heart,
  Lock,
  Crown,
  TreePine,
  Waves,
  Mountain,
  Snowflake,
  MapPin,
  Star
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

const RARITY_STARS = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
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
  const [selectedPet, setSelectedPet] = useState<AnimalData | null>(null);
  const [activeTab, setActiveTab] = useState<"pets" | "worlds">("pets");

  const filteredPets = filterAnimals(searchQuery, "all", "all");

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 pb-24">
      {/* Header Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("pets")}
            className={cn(
              "flex-1 py-4 text-center font-semibold text-sm transition-all",
              activeTab === "pets"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-400"
            )}
          >
            <div>PETS</div>
            <div className="text-xs font-normal">{stats.unlockedAnimals}/{stats.totalAnimals}</div>
          </button>
          <button
            onClick={() => setActiveTab("worlds")}
            className={cn(
              "flex-1 py-4 text-center font-semibold text-sm transition-all",
              activeTab === "worlds"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-400"
            )}
          >
            <div>WORLDS</div>
            <div className="text-xs font-normal">{BIOME_DATABASE.filter(b => b.unlockLevel <= currentLevel).length}/{BIOME_DATABASE.length}</div>
          </button>
        </div>

        {/* Search */}
        {activeTab === "pets" && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-gray-100 border-0 rounded-full text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === "pets" && (
        <div className="px-2 pt-2">
          {/* Grid */}
          <div className="grid grid-cols-3 gap-1">
            {filteredPets.map((pet) => {
              const isLocked = !isAnimalUnlocked(pet.id);
              const isFavorited = isAnimalFavorite(pet.id);
              const stars = RARITY_STARS[pet.rarity];

              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={cn(
                    "bg-white rounded-lg p-3 flex flex-col items-center relative transition-all active:scale-95",
                    isLocked && "bg-gray-100"
                  )}
                >
                  {/* Favorite heart */}
                  {!isLocked && isFavorited && (
                    <div className="absolute top-2 left-2">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </div>
                  )}

                  {/* Level badge for locked */}
                  {isLocked && (
                    <div className="absolute top-2 right-2 bg-gray-200 rounded-full px-2 py-0.5">
                      <span className="text-[10px] font-semibold text-gray-500">Lv.{pet.unlockLevel}</span>
                    </div>
                  )}

                  {/* Emoji or Lock */}
                  <div className={cn(
                    "text-4xl mb-2 h-12 flex items-center justify-center",
                    isLocked && "opacity-30"
                  )}>
                    {isLocked ? (
                      <Lock className="w-8 h-8 text-gray-400" />
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
                            ? "text-gray-300"
                            : "text-amber-400 fill-amber-400"
                        )}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <span className={cn(
                    "text-xs font-medium truncate w-full text-center",
                    isLocked ? "text-gray-400" : "text-gray-700"
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
        <div className="px-4 pt-4 space-y-3">
          {BIOME_DATABASE.map((biome) => {
            const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || TreePine;
            const isActive = biome.name === currentBiome;
            const isUnlocked = biome.unlockLevel <= currentLevel;

            return (
              <div
                key={biome.name}
                className={cn(
                  "bg-white rounded-xl p-4 transition-all",
                  isActive && "ring-2 ring-primary",
                  !isUnlocked && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isActive ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-500"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {isUnlocked ? biome.name : "???"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {isUnlocked ? (
                          isActive ? 'Currently here' : biome.description
                        ) : (
                          `Unlock at Level ${biome.unlockLevel}`
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnlocked && !isActive && (
                    <button
                      onClick={() => switchBiome(biome.name)}
                      className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition-all"
                    >
                      Visit
                    </button>
                  )}

                  {isActive && (
                    <div className="bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
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
        <DialogContent className="max-w-xs bg-white rounded-2xl border-0 p-0 overflow-hidden">
          {selectedPet && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-b from-sky-100 to-white p-8 text-center">
                <div className="text-6xl mb-4">
                  {isAnimalUnlocked(selectedPet.id) ? selectedPet.emoji : "❓"}
                </div>

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
                  <DialogTitle className="text-xl font-bold text-gray-800">
                    {isAnimalUnlocked(selectedPet.id) ? selectedPet.name : "???"}
                  </DialogTitle>
                </DialogHeader>

                <span className="text-xs text-gray-400 capitalize">
                  {selectedPet.rarity} • {selectedPet.biome}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {isAnimalUnlocked(selectedPet.id) ? (
                  <>
                    <p className="text-sm text-gray-500 text-center">
                      {selectedPet.description}
                    </p>

                    <button
                      onClick={() => toggleFavorite(selectedPet.id)}
                      className={cn(
                        "w-full py-3 rounded-full font-semibold text-sm transition-all active:scale-95",
                        isAnimalFavorite(selectedPet.id)
                          ? "bg-red-50 text-red-500"
                          : "bg-gray-100 text-gray-600"
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
                    <Lock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400 mb-4">
                      This pet is locked
                    </p>
                    <div className="inline-block bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold">
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
