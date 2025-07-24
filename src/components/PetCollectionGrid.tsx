import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Star, 
  Heart, 
  Lock, 
  Sparkles,
  Trophy,
  Eye,
  Gift,
  Crown,
  TreePine,
  Waves,
  Mountain,
  Snowflake
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection } from "@/hooks/useCollection";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { AnimalData, BiomeData, BIOME_DATABASE } from "@/data/AnimalDatabase";
import { AnimalViewer3D } from "@/components/AnimalViewer3D";

const BIOME_ICONS = {
  'Meadow': TreePine,
  'Forest': TreePine,
  'Ocean': Waves,
  'Mountains': Mountain,
  'Tundra': Snowflake,
};

const RARITY_COLORS = {
  common: "text-muted-foreground border-muted",
  rare: "text-primary border-primary",
  epic: "text-purple-500 border-purple-500",
  legendary: "text-accent border-accent"
};

const RARITY_BACKGROUNDS = {
  common: "bg-muted/20",
  rare: "bg-primary/10",
  epic: "bg-purple-500/10", 
  legendary: "bg-accent/20"
};

// Component for enhanced collection with real data integration
export const PetCollectionGrid = () => {

  const { 
    currentLevel, 
    currentBiome, 
    availableBiomes,
    switchBiome 
  } = useAppStateTracking();
  
  const {
    allAnimals,
    unlockedAnimalsData,
    currentBiomeAnimals,
    favorites,
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
  const [viewing3D, setViewing3D] = useState<AnimalData | null>(null);

  const filteredPets = filterAnimals(searchQuery, selectedRarity, selectedBiome);

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Sparkles className="w-4 h-4" />;
      case 'epic': return <Trophy className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Animal Collection
          </CardTitle>
          <CardDescription>
            Level {currentLevel} • {stats.unlockedAnimals}/{stats.totalAnimals} animals unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="animals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="animals">Animals</TabsTrigger>
              <TabsTrigger value="biomes">Biomes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="animals" className="space-y-4">

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search animals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {["all", "common", "rare", "epic", "legendary"].map((rarity) => (
                    <Button
                      key={rarity}
                      variant={selectedRarity === rarity ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRarity(rarity)}
                      className="capitalize"
                    >
                      {rarity === "all" ? <Filter className="w-4 h-4" /> : getRarityIcon(rarity)}
                      <span className="ml-1">{rarity}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Collection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPets.map((pet) => {
                  const isLocked = !isAnimalUnlocked(pet.id);
                  const canUnlock = currentLevel >= pet.unlockLevel;
                  const isFavorited = isAnimalFavorite(pet.id);
                  
                  return (
                    <Card
                      key={pet.id}
                      className={cn(
                        "relative p-4 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg",
                        isLocked && !canUnlock && "opacity-50",
                        RARITY_BACKGROUNDS[pet.rarity],
                        RARITY_COLORS[pet.rarity]
                      )}
                      onClick={() => setSelectedPet(pet)}
                    >
                      {/* Favorite button */}
                      {!isLocked && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pet.id);
                          }}
                        >
                          <Heart 
                            className={cn(
                              "w-4 h-4",
                              isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"
                            )} 
                          />
                        </Button>
                      )}

                      {/* Rarity indicator */}
                      <div className="absolute top-2 left-2">
                        {getRarityIcon(pet.rarity)}
                      </div>

                      {/* Pet content */}
                      <div className="text-center">
                        <div className="text-4xl mb-2 relative">
                          {isLocked ? (
                            <div className="flex items-center justify-center">
                              <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                          ) : (
                            pet.emoji
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-sm mb-1">
                          {isLocked ? "???" : pet.name}
                        </h3>
                        
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          {pet.rarity && (
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", RARITY_COLORS[pet.rarity])}
                            >
                              {pet.rarity}
                            </Badge>
                          )}
                        </div>

                        {/* Unlock requirement */}
                        {isLocked && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {canUnlock ? (
                              <Badge variant="secondary" className="text-xs">
                                <Gift className="w-3 h-3 mr-1" />
                                Ready to unlock!
                              </Badge>
                            ) : (
                              <span>Level {pet.unlockLevel}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                
                {/* Show next unlock preview for animals */}
                {filteredPets.length > 0 && (
                  <>
                    {allAnimals
                      .filter(animal => animal.unlockLevel === currentLevel + 1)
                      .slice(0, 1)
                      .map(animal => (
                        <Card key={`preview-${animal.id}`} className="text-center p-4 border-dashed opacity-50">
                          <div className="text-3xl mb-2">❓</div>
                          <div className="text-sm font-medium">???</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            Level {animal.unlockLevel}
                          </Badge>
                        </Card>
                      ))}
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="biomes" className="space-y-4">
              <div className="space-y-3">
                {BIOME_DATABASE.map((biome) => {
                  const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || TreePine;
                  const isActive = biome.name === currentBiome;
                  const isUnlocked = biome.unlockLevel <= currentLevel;
                  
                  return (
                    <Card 
                      key={biome.name} 
                      className={cn(
                        "p-4 transition-all",
                        isActive && "ring-2 ring-primary bg-primary/5",
                        !isUnlocked && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6" />
                          <div>
                            <div className="font-medium">
                              {isUnlocked ? biome.name : "???"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {isUnlocked ? (
                                isActive ? 'Currently active' : biome.description
                              ) : (
                                `Unlocks at Level ${biome.unlockLevel}`
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isUnlocked && !isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => switchBiome(biome.name)}
                          >
                            Switch
                          </Button>
                        )}
                        
                        {isActive && (
                          <Badge>Active</Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pet Detail Modal */}
      <Dialog open={!!selectedPet} onOpenChange={() => setSelectedPet(null)}>
        <DialogContent className="max-w-md">
          {selectedPet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedPet.emoji}</span>
                  {selectedPet.name}
                  {getRarityIcon(selectedPet.rarity)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedPet.description}
                </p>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Abilities
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.abilities.map((ability, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {ability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Biome:</span>
                  <Badge variant="outline">{selectedPet.biome}</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rarity:</span>
                  <Badge 
                    variant="outline" 
                    className={RARITY_COLORS[selectedPet.rarity]}
                  >
                    {selectedPet.rarity}
                  </Badge>
                </div>

                {isAnimalUnlocked(selectedPet.id) && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => toggleFavorite(selectedPet.id)}
                    >
                      <Heart className={cn(
                        "w-4 h-4 mr-2",
                        isAnimalFavorite(selectedPet.id) ? "fill-red-500 text-red-500" : ""
                      )} />
                      {isAnimalFavorite(selectedPet.id) ? "Unfavorite" : "Favorite"}
                    </Button>
                    
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setSelectedPet(null);
                        setViewing3D(selectedPet);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View in 3D
                    </Button>
                  </div>
                )}

                {!isAnimalUnlocked(selectedPet.id) && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Reach level {selectedPet.unlockLevel} to unlock this pet
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 3D Viewer Modal */}
      <AnimalViewer3D
        animal={viewing3D}
        isOpen={!!viewing3D}
        onClose={() => setViewing3D(null)}
      />
    </div>
  );
};

// Export as both names for compatibility
export const AnimalCollection = PetCollectionGrid;