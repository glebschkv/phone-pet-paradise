import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { Crown, TreePine, Waves, Mountain, Snowflake } from "lucide-react";

const BIOME_ICONS = {
  'Meadow': TreePine,
  'Forest': TreePine,
  'Ocean': Waves,
  'Desert': Mountain,
  'Tundra': Snowflake,
};

const ANIMAL_EMOJIS: Record<string, string> = {
  'Elephant': '🐘',
  'Rabbit': '🐰',
  'Fox': '🦊',
  'Deer': '🦌',
  'Owl': '🦉',
  'Bear': '🐻',
  'Wolf': '🐺',
  'Eagle': '🦅',
  'Turtle': '🐢',
  'Penguin': '🐧',
  'Seal': '🦭',
  'Cactus': '🌵',
  'Snake': '🐍',
  'Camel': '🐪',
  'Polar Bear': '🐻‍❄️',
  'Arctic Fox': '🦊',
};

export const AnimalCollection = () => {
  const {
    currentLevel,
    unlockedAnimals,
    currentBiome,
    availableBiomes,
    switchBiome,
  } = useAppStateTracking();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Animal Collection
          </CardTitle>
          <CardDescription>
            Level {currentLevel} • {unlockedAnimals.length} animals unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="animals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="animals">Animals</TabsTrigger>
              <TabsTrigger value="biomes">Biomes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="animals" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {unlockedAnimals.map((animal, index) => (
                  <Card key={animal} className="text-center p-4">
                    <div className="text-3xl mb-2">
                      {ANIMAL_EMOJIS[animal] || '🐾'}
                    </div>
                    <div className="text-sm font-medium">{animal}</div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Level {index + 1}
                    </Badge>
                  </Card>
                ))}
                
                {/* Show next unlock preview */}
                {currentLevel < 20 && (
                  <Card className="text-center p-4 border-dashed opacity-50">
                    <div className="text-3xl mb-2">❓</div>
                    <div className="text-sm font-medium">???</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      Level {currentLevel + 1}
                    </Badge>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="biomes" className="space-y-4">
              <div className="space-y-3">
                {availableBiomes.map((biome) => {
                  const Icon = BIOME_ICONS[biome as keyof typeof BIOME_ICONS] || TreePine;
                  const isActive = biome === currentBiome;
                  
                  return (
                    <Card 
                      key={biome} 
                      className={`p-4 transition-all ${
                        isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6" />
                          <div>
                            <div className="font-medium">{biome}</div>
                            <div className="text-sm text-muted-foreground">
                              {isActive ? 'Currently active' : 'Available biome'}
                            </div>
                          </div>
                        </div>
                        
                        {!isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => switchBiome(biome)}
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
                
                {/* Show next biome unlock */}
                {!availableBiomes.includes('Forest') && currentLevel < 5 && (
                  <Card className="p-4 border-dashed opacity-50">
                    <div className="flex items-center gap-3">
                      <TreePine className="w-6 h-6" />
                      <div>
                        <div className="font-medium">Forest Biome</div>
                        <div className="text-sm text-muted-foreground">
                          Unlocks at Level 5
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
                
                {!availableBiomes.includes('Ocean') && currentLevel < 10 && availableBiomes.includes('Forest') && (
                  <Card className="p-4 border-dashed opacity-50">
                    <div className="flex items-center gap-3">
                      <Waves className="w-6 h-6" />
                      <div>
                        <div className="font-medium">Ocean Biome</div>
                        <div className="text-sm text-muted-foreground">
                          Unlocks at Level 10
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};