import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Utensils, 
  Gamepad2, 
  Sparkles,
  Clock,
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PetStats {
  happiness: number;
  hunger: number;
  energy: number;
  lastFed: number;
  lastPlayed: number;
}

interface PetInteractionProps {
  petName: string;
  petType: string;
  onStatsUpdate?: (stats: PetStats) => void;
}

export const PetInteraction = ({ petName, petType, onStatsUpdate }: PetInteractionProps) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<PetStats>({
    happiness: 80,
    hunger: 60,
    energy: 90,
    lastFed: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    lastPlayed: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
  });

  const [isInteracting, setIsInteracting] = useState(false);

  // Use ref for callback to prevent interval recreation on parent re-renders
  const onStatsUpdateRef = useRef(onStatsUpdate);
  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onStatsUpdate]);

  useEffect(() => {
    // Simulate stat decay over time
    const interval = setInterval(() => {
      setStats(prevStats => {
        const now = Date.now();
        const hoursSinceLastFed = (now - prevStats.lastFed) / (1000 * 60 * 60);
        const hoursSinceLastPlayed = (now - prevStats.lastPlayed) / (1000 * 60 * 60);

        let newStats = { ...prevStats };

        // Hunger (fullness) decreases over time - pet gets hungrier
        if (hoursSinceLastFed > 1) {
          newStats.hunger = Math.max(0, newStats.hunger - hoursSinceLastFed * 5);
        }

        // Happiness decreases if not played with
        if (hoursSinceLastPlayed > 2) {
          newStats.happiness = Math.max(0, newStats.happiness - hoursSinceLastPlayed * 3);
        }

        // Energy regenerates over time
        newStats.energy = Math.min(100, newStats.energy + 1);

        // Use ref to call latest callback without recreating interval
        onStatsUpdateRef.current?.(newStats);
        return newStats;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []); // Empty deps - interval never recreated

  const feedPet = async () => {
    if (stats.hunger > 80) {
      toast({
        title: `${petName} is not hungry`,
        description: "Your pet is already well-fed!",
        variant: "default",
      });
      return;
    }

    setIsInteracting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    setStats(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 30),
      happiness: Math.min(100, prev.happiness + 10),
      lastFed: Date.now(),
    }));

    toast({
      title: `${petName} loved the food!`,
      description: "Happiness and hunger restored",
      variant: "default",
    });

    setIsInteracting(false);
  };

  const playWithPet = async () => {
    if (stats.energy < 20) {
      toast({
        title: `${petName} is too tired`,
        description: "Let your pet rest a bit more!",
        variant: "default",
      });
      return;
    }

    setIsInteracting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    setStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 25),
      energy: Math.max(0, prev.energy - 15),
      lastPlayed: Date.now(),
    }));

    toast({
      title: `${petName} had a great time!`,
      description: "Happiness increased from playing",
      variant: "default",
    });

    setIsInteracting(false);
  };

  const giftTreat = async () => {
    setIsInteracting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStats(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      hunger: Math.min(100, prev.hunger + 10),
    }));

    toast({
      title: `${petName} loves the special treat!`,
      description: "Both happiness and hunger improved",
      variant: "default",
    });

    setIsInteracting(false);
  };

  const getStatusColor = (value: number) => {
    if (value > 70) return 'text-green-500';
    if (value > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (value: number) => {
    if (value > 80) return { text: 'Great', variant: 'default' as const };
    if (value > 60) return { text: 'Good', variant: 'secondary' as const };
    if (value > 30) return { text: 'Needs Care', variant: 'destructive' as const };
    return { text: 'Critical', variant: 'destructive' as const };
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">{petName}</h3>
          <Badge variant="outline" className="mb-4">
            {petType}
          </Badge>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Heart className="w-4 h-4" />
                Happiness
              </span>
              <Badge {...getStatusBadge(stats.happiness)}>
                {getStatusBadge(stats.happiness).text}
              </Badge>
            </div>
            <Progress value={stats.happiness} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Utensils className="w-4 h-4" />
                Hunger
              </span>
              <span className={`text-sm ${getStatusColor(stats.hunger)}`}>
                {stats.hunger}%
              </span>
            </div>
            <Progress value={stats.hunger} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Energy
              </span>
              <span className={`text-sm ${getStatusColor(stats.energy)}`}>
                {stats.energy}%
              </span>
            </div>
            <Progress value={stats.energy} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={feedPet}
              disabled={isInteracting || stats.hunger > 80}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Utensils className="w-4 h-4" />
              Feed Pet
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={playWithPet}
              disabled={isInteracting || stats.energy < 20}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Gamepad2 className="w-4 h-4" />
              Play
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={giftTreat}
              disabled={isInteracting}
              className="w-full flex items-center gap-2"
              variant="default"
            >
              <Gift className="w-4 h-4" />
              Give Treat
            </Button>
          </motion.div>
        </div>

        {isInteracting && (
          <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Interacting with {petName}...
          </div>
        )}
      </CardContent>
    </Card>
  );
};