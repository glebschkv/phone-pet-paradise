import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Play, Gift, Zap, Camera } from 'lucide-react';
import { useBondSystem } from '@/hooks/useBondSystem';
import { getAnimalById } from '@/data/AnimalDatabase';

interface PetBondInterfaceProps {
  animalId: string;
  onClose?: () => void;
}

export const PetBondInterface: React.FC<PetBondInterfaceProps> = ({ animalId, onClose }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [_selectedTraining, _setSelectedTraining] = useState<string>('');
  
  const {
    getBondLevel,
    getExperienceProgress,
    getMoodState,
    feedPet,
    playWithPet,
    trainPet,
    giftTreat,
    getAbilityBonuses,
    getPetPersonality
  } = useBondSystem();

  const animal = getAnimalById(animalId);
  const bondLevel = getBondLevel(animalId);
  const experience = getExperienceProgress(animalId);
  const mood = getMoodState(animalId);
  const personality = getPetPersonality(animalId);
  const bonuses = getAbilityBonuses(animalId);

  if (!animal) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p>Pet not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleInteraction = async (action: () => Promise<boolean>) => {
    setIsInteracting(true);
    try {
      await action();
    } finally {
      setIsInteracting(false);
    }
  };

  const getMoodEmoji = (moodState: string): string => {
    switch (moodState) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'lonely': return '😢';
      case 'sleepy': return '😴';
      default: return '😌';
    }
  };

  const getBondLevelTitle = (level: number): string => {
    if (level >= 10) return 'Soulmate';
    if (level >= 8) return 'Best Friend';
    if (level >= 6) return 'Close Friend';
    if (level >= 4) return 'Good Friend';
    if (level >= 2) return 'Companion';
    return 'Acquaintance';
  };

  const trainingOptions = [
    { id: 'focus', name: 'Focus Training', icon: '🎯', description: 'Improve concentration abilities' },
    { id: 'agility', name: 'Agility Training', icon: '⚡', description: 'Enhance quick thinking skills' },
    { id: 'wisdom', name: 'Wisdom Training', icon: '🧠', description: 'Develop problem-solving abilities' },
    { id: 'patience', name: 'Patience Training', icon: '🧘', description: 'Build endurance and calm' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="text-6xl mb-4">{animal.emoji}</div>
        <CardTitle className="text-2xl">{animal.name}</CardTitle>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{getBondLevelTitle(bondLevel)}</Badge>
          <span>{getMoodEmoji(mood)} {mood}</span>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="interact" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="interact">Interact</TabsTrigger>
            <TabsTrigger value="train">Train</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
          </TabsList>

          <TabsContent value="interact" className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Bond Level {bondLevel}/10</span>
                  <span>{experience}%</span>
                </div>
                <Progress value={experience} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleInteraction(() => feedPet(animalId))}
                  disabled={isInteracting}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Heart className="h-6 w-6" />
                  <span>Feed</span>
                </Button>

                <Button
                  onClick={() => handleInteraction(() => playWithPet(animalId))}
                  disabled={isInteracting}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Play className="h-6 w-6" />
                  <span>Play</span>
                </Button>

                <Button
                  onClick={() => handleInteraction(() => giftTreat(animalId))}
                  disabled={isInteracting}
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Gift className="h-6 w-6" />
                  <span>Treat</span>
                </Button>

                <Button
                  disabled
                  className="h-20 flex flex-col gap-2"
                  variant="outline"
                >
                  <Camera className="h-6 w-6" />
                  <span>Photo</span>
                  <Badge variant="secondary" className="text-xs">Soon</Badge>
                </Button>
              </div>

              {isInteracting && (
                <div className="text-center text-sm text-muted-foreground">
                  Interacting with {animal.name}...
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="train" className="space-y-4">
            <div className="grid gap-3">
              {trainingOptions.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => handleInteraction(() => trainPet(animalId, option.name))}
                  disabled={isInteracting}
                  className="h-16 justify-start"
                  variant="outline"
                >
                  <span className="text-2xl mr-3">{option.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">Personality</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Energy</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i <= personality.energy ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Curiosity</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i <= personality.curiosity ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyalty</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i <= personality.loyalty ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Current Bonuses</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Focus Bonus</span>
                    <span className="text-primary">+{bonuses.focusBonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience Bonus</span>
                    <span className="text-primary">+{bonuses.experienceBonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Bonus</span>
                    <span className="text-primary">+{bonuses.timeBonus}%</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Natural Abilities</h4>
              <div className="grid gap-2">
                {animal.abilities.map((ability, index) => (
                  <Badge key={index} variant="secondary" className="justify-start p-2">
                    <Zap className="h-3 w-3 mr-2" />
                    {ability}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Bond Abilities</h4>
              <div className="text-sm text-muted-foreground">
                {bondLevel >= 3 && <div>✅ Focus Enhancement unlocked</div>}
                {bondLevel >= 5 && <div>✅ Experience Multiplier unlocked</div>}
                {bondLevel >= 7 && <div>✅ Special Animation unlocked</div>}
                {bondLevel >= 10 && <div>✅ Master Bond: Ultimate Ability unlocked</div>}
                {bondLevel < 10 && (
                  <div className="mt-2">
                    Next unlock at Bond Level {bondLevel + 1}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {onClose && (
          <div className="mt-6 text-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};