import { useState } from 'react';
import { Volume2, VolumeX, Lock, Crown, ChevronDown, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  AMBIENT_SOUNDS,
  AMBIENT_CATEGORIES,
  AmbientSoundCategory,
  AmbientSound,
} from '@/data/AmbientSoundsData';
import { useAmbientSound } from '@/hooks/useAmbientSound';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const AmbientSoundPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AmbientSoundCategory | 'all'>('all');
  const {
    currentSound,
    currentSoundId,
    volume,
    isPlaying,
    play,
    stop,
    setVolume,
  } = useAmbientSound();
  const { isPremium } = usePremiumStatus();

  const filteredSounds = selectedCategory === 'all'
    ? AMBIENT_SOUNDS
    : AMBIENT_SOUNDS.filter(s => s.category === selectedCategory);

  const handleSoundSelect = (sound: AmbientSound) => {
    if (sound.isPremium && !isPremium) {
      // Show premium upsell - handled by parent or modal
      return;
    }

    if (currentSoundId === sound.id && isPlaying) {
      stop();
    } else {
      play(sound.id);
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      stop();
    } else if (currentSoundId) {
      play(currentSoundId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95",
            isPlaying
              ? "bg-gradient-to-b from-purple-400 to-purple-500 text-white shadow-md"
              : "bg-white/20 backdrop-blur-sm text-white/80 hover:bg-white/30"
          )}
        >
          {isPlaying ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold">
            {currentSound ? currentSound.name : 'Sounds'}
          </span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 pb-2 bg-gradient-to-b from-purple-500 to-purple-600 text-white">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Volume2 className="w-5 h-5" />
            Ambient Sounds
          </DialogTitle>
          <p className="text-xs text-purple-100">
            Choose sounds to help you focus
          </p>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Current Sound & Volume */}
          {currentSoundId && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentSound?.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{currentSound?.name}</p>
                    <p className="text-[10px] text-muted-foreground">Now playing</p>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isPlaying
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[volume]}
                  onValueChange={([v]) => setVolume(v)}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold w-8">{volume}%</span>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === 'all'
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              )}
            >
              All
            </button>
            {AMBIENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1",
                  selectedCategory === cat.id
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                )}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sound Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {filteredSounds.map((sound) => {
              const isSelected = currentSoundId === sound.id;
              const isLocked = sound.isPremium && !isPremium;

              return (
                <button
                  key={sound.id}
                  onClick={() => handleSoundSelect(sound)}
                  disabled={isLocked}
                  className={cn(
                    "relative p-3 rounded-xl text-left transition-all",
                    isSelected && isPlaying
                      ? "bg-gradient-to-br from-purple-400 to-purple-500 text-white ring-2 ring-purple-300"
                      : isSelected
                      ? "bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-300"
                      : isLocked
                      ? "bg-gray-100 dark:bg-gray-800 opacity-60"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {/* Premium badge */}
                  {sound.isPremium && (
                    <div className="absolute top-1 right-1">
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                  )}

                  <div className="text-2xl mb-1">{sound.icon}</div>
                  <p className={cn(
                    "text-xs font-bold",
                    isSelected && isPlaying ? "text-white" : ""
                  )}>
                    {sound.name}
                  </p>
                  <p className={cn(
                    "text-[10px] line-clamp-2",
                    isSelected && isPlaying ? "text-purple-100" : "text-muted-foreground"
                  )}>
                    {sound.description}
                  </p>

                  {isSelected && isPlaying && (
                    <div className="absolute bottom-2 right-2 flex gap-0.5">
                      <span className="w-1 h-3 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Premium Upsell */}
          {!isPremium && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Unlock Premium Sounds
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Get access to lo-fi beats, nature sounds, and more with Premium!
              </p>
            </div>
          )}

          {/* Turn Off Button */}
          {currentSoundId && (
            <button
              onClick={() => {
                stop();
              }}
              className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Turn Off Sound
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
