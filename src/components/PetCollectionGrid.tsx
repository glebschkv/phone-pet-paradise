import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Star, 
  Heart, 
  Lock, 
  Sparkles,
  Trophy,
  Eye,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";

interface PetData {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel: number;
  isUnlocked: boolean;
  isFavorite?: boolean;
  description: string;
  abilities: string[];
  biome: string;
}

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

// Mock pet data - in a real app this would come from your game state
const MOCK_PETS: PetData[] = [
  {
    id: 'elephant',
    name: 'Elephant',
    emoji: '🐘',
    rarity: 'common',
    unlockLevel: 1,
    isUnlocked: true,
    description: 'A gentle giant with incredible memory and wisdom.',
    abilities: ['Memory Boost', 'Wisdom Share'],
    biome: 'Savanna'
  },
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    rarity: 'rare',
    unlockLevel: 3,
    isUnlocked: true,
    isFavorite: true,
    description: 'Cunning and agile, perfect for focus sessions.',
    abilities: ['Quick Thinking', 'Agility Boost'],
    biome: 'Forest'
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    rarity: 'legendary',
    unlockLevel: 15,
    isUnlocked: false,
    description: 'Mythical creature that brings powerful focus energy.',
    abilities: ['Fire Focus', 'Legendary Wisdom', 'Time Mastery'],
    biome: 'Mountains'
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    rarity: 'epic',
    unlockLevel: 10,
    isUnlocked: false,
    description: 'Magical being that enhances creativity and inspiration.',
    abilities: ['Creative Spark', 'Magic Focus', 'Inspiration'],
    biome: 'Enchanted Forest'
  },
  {
    id: 'turtle',
    name: 'Turtle',
    emoji: '🐢',
    rarity: 'common',
    unlockLevel: 2,
    isUnlocked: true,
    description: 'Slow and steady, perfect for long focus sessions.',
    abilities: ['Endurance', 'Patience'],
    biome: 'Ocean'
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    rarity: 'rare',
    unlockLevel: 5,
    isUnlocked: false,
    description: 'Wise night creature, excellent for evening study.',
    abilities: ['Night Focus', 'Wisdom', 'Silent Study'],
    biome: 'Forest'
  }
];

export const PetCollectionGrid = () => {
  const { currentLevel } = useAppStateTracking();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedPet, setSelectedPet] = useState<PetData | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filteredPets = MOCK_PETS.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === "all" || pet.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const unlockedCount = MOCK_PETS.filter(pet => pet.isUnlocked).length;
  const totalCount = MOCK_PETS.length;

  const toggleFavorite = (petId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(petId)) {
        newFavorites.delete(petId);
      } else {
        newFavorites.add(petId);
      }
      return newFavorites;
    });
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Sparkles className="w-4 h-4" />;
      case 'epic': return <Trophy className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pet Collection</h1>
          <p className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount} pets discovered
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          Level {currentLevel}
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search pets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {["all", "common", "rare", "epic", "legendary"].map((rarity) => (
            <Button
              key={rarity}
              variant={selectedRarity === rarity ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRarity(rarity)}
              className="capitalize"
            >
              {rarity === "all" ? <Filter className="w-4 h-4" /> : getRarityIcon(rarity)}
              {rarity}
            </Button>
          ))}
        </div>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPets.map((pet) => {
          const isLocked = !pet.isUnlocked;
          const canUnlock = currentLevel >= pet.unlockLevel;
          const isFavorited = favorites.has(pet.id) || pet.isFavorite;
          
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
              {pet.isUnlocked && (
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
      </div>

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

                {selectedPet.isUnlocked && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => toggleFavorite(selectedPet.id)}
                    >
                      <Heart className={cn(
                        "w-4 h-4 mr-2",
                        favorites.has(selectedPet.id) ? "fill-red-500 text-red-500" : ""
                      )} />
                      {favorites.has(selectedPet.id) ? "Unfavorite" : "Favorite"}
                    </Button>
                    
                    <Button className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View in 3D
                    </Button>
                  </div>
                )}

                {!selectedPet.isUnlocked && (
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
    </div>
  );
};