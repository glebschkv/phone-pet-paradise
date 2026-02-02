import { useState } from 'react';
import { Volume2, VolumeX, Lock, Crown, ChevronDown, Play, Pause, Music, X, Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  AMBIENT_SOUNDS,
  AMBIENT_CATEGORIES,
  AmbientSoundCategory,
  AmbientSound,
} from '@/data/AmbientSoundsData';
import { useSoundMixer } from '@/hooks/useSoundMixer';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Sound wave animation bars component
const SoundWaveBars = ({ isPlaying, small = false }: { isPlaying: boolean; small?: boolean }) => (
  <div className={cn("flex items-end gap-0.5", small ? "h-3" : "h-4")}>
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className={cn(
          "rounded-full transition-all",
          small ? "w-0.5" : "w-1",
          isPlaying ? "animate-pulse" : "opacity-40"
        )}
        style={{
          height: isPlaying ? `${40 + Math.random() * 60}%` : '30%',
          background: 'currentColor',
          animationDelay: `${i * 100}ms`,
          animationDuration: `${400 + i * 100}ms`,
        }}
      />
    ))}
  </div>
);

export const AmbientSoundPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AmbientSoundCategory | 'all'>('all');
  const {
    layers,
    masterVolume,
    isPlaying,
    maxLayers,
    playAll,
    stopAll,
    toggle,
    addLayer,
    removeLayer,
    setLayerVolume,
    setMasterVolume,
    getLayerDetails,
    canAddLayer,
  } = useSoundMixer();
  const { isPremium } = usePremiumStatus();

  const layerDetails = getLayerDetails();
  const primarySound = layerDetails.length > 0 ? layerDetails[0].sound : null;

  const filteredSounds = selectedCategory === 'all'
    ? AMBIENT_SOUNDS
    : AMBIENT_SOUNDS.filter(s => s.category === selectedCategory);

  // Separate free and premium sounds
  const freeSounds = filteredSounds.filter(s => !s.isPremium);
  const premiumSounds = filteredSounds.filter(s => s.isPremium);

  const handleSoundSelect = (sound: AmbientSound) => {
    if (sound.isPremium && !isPremium) {
      return;
    }

    // If sound is already in layers, remove it
    if (layers.some(l => l.soundId === sound.id)) {
      removeLayer(sound.id);
      return;
    }

    // If at max layers, remove the oldest one first (for free users this replaces the sound)
    if (!canAddLayer()) {
      if (layers.length > 0) {
        removeLayer(layers[0].soundId);
      }
    }

    addLayer(sound.id);

    // Auto-play if not already playing
    if (!isPlaying) {
      // Small delay to let state update
      setTimeout(() => playAll(), 50);
    }
  };

  const handleToggle = () => {
    if (layers.length === 0) return;
    toggle();
  };

  const triggerLabel = layerDetails.length > 1
    ? `${layerDetails.length} Sounds`
    : primarySound
    ? primarySound.name
    : 'Sounds';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all active:scale-95"
          style={{
            background: isPlaying
              ? 'linear-gradient(180deg, hsl(140 60% 45%) 0%, hsl(140 60% 38%) 100%)'
              : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)',
            border: '2px solid hsl(var(--border))',
            boxShadow: isPlaying
              ? '0 3px 0 hsl(140 50% 25%), inset 0 1px 0 hsl(140 70% 60% / 0.3)'
              : '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.1)',
            color: isPlaying ? 'white' : 'inherit',
          }}
        >
          {isPlaying ? (
            <SoundWaveBars isPlaying={true} small />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-xs font-bold">
            {triggerLabel}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm p-0 overflow-hidden retro-card border-2 border-border">
        {/* Header with warm golden gradient */}
        <div
          className="p-4 pb-3"
          style={{
            background: 'linear-gradient(180deg, hsl(35 45% 92%) 0%, hsl(32 40% 87%) 100%)',
            borderBottom: '2px solid hsl(30 35% 70%)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, hsl(260 60% 55%) 0%, hsl(260 60% 45%) 100%)',
                  border: '2px solid hsl(260 50% 35%)',
                  boxShadow: '0 2px 0 hsl(260 50% 30%), inset 0 1px 0 hsl(260 70% 70% / 0.3)',
                }}
              >
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold">Focus Sounds</span>
                <p className="text-[10px] text-muted-foreground font-normal">
                  {maxLayers > 1 ? 'Mix ambient sounds for better focus' : 'Ambient audio for better concentration'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Active Layers Widget */}
          {layers.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background: isPlaying
                  ? 'linear-gradient(180deg, hsl(140 40% 92%) 0%, hsl(140 35% 88%) 100%)'
                  : 'linear-gradient(180deg, hsl(var(--muted) / 0.5) 0%, hsl(var(--muted) / 0.3) 100%)',
                border: `2px solid ${isPlaying ? 'hsl(140 40% 70%)' : 'hsl(var(--border))'}`,
                boxShadow: '0 2px 0 hsl(var(--border) / 0.3), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
              }}
            >
              {/* Header with play/pause */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {layers.length > 1 && (
                    <Layers className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {layers.length === 1 ? layerDetails[0]?.sound?.name : `${layers.length} Sound Layers`}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {isPlaying ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Now playing</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Paused</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: isPlaying
                      ? 'linear-gradient(180deg, hsl(140 60% 45%) 0%, hsl(140 60% 38%) 100%)'
                      : 'linear-gradient(180deg, hsl(260 60% 55%) 0%, hsl(260 60% 45%) 100%)',
                    border: `2px solid ${isPlaying ? 'hsl(140 50% 30%)' : 'hsl(260 50% 35%)'}`,
                    boxShadow: `0 3px 0 ${isPlaying ? 'hsl(140 50% 25%)' : 'hsl(260 50% 30%)'}, inset 0 1px 0 hsl(0 0% 100% / 0.2)`,
                    color: 'white',
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Per-layer controls (shown when multiple layers) */}
              {layers.length > 1 && (
                <div className="space-y-2 mb-3">
                  {layerDetails.map((layer) => (
                    <div
                      key={layer.soundId}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        background: 'hsl(var(--background) / 0.6)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <span className="text-lg flex-shrink-0">{layer.sound?.icon}</span>
                      <span className="text-[10px] font-bold flex-shrink-0 w-14 truncate">
                        {layer.sound?.name}
                      </span>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[layer.volume]}
                        onValueChange={([v]) => setLayerVolume(layer.soundId, v)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeLayer(layer.soundId)}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Master Volume Control */}
              <div
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{
                  background: 'hsl(var(--background) / 0.6)',
                  border: '1px solid hsl(var(--border) / 0.5)',
                }}
              >
                <VolumeX className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[layers.length === 1 ? layers[0].volume : masterVolume]}
                  onValueChange={([v]) => {
                    if (layers.length === 1) {
                      setLayerVolume(layers[0].soundId, v);
                    } else {
                      setMasterVolume(v);
                    }
                  }}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span
                  className="text-xs font-bold w-9 text-center py-0.5 rounded"
                  style={{
                    background: 'hsl(var(--muted) / 0.5)',
                  }}
                >
                  {layers.length === 1 ? layers[0].volume : masterVolume}%
                </span>
              </div>
            </div>
          )}

          {/* Layer slots indicator for premium users */}
          {isPremium && maxLayers > 1 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Sound Layers: {layers.length}/{maxLayers}
                </span>
              </div>
              {canAddLayer() && (
                <span className="text-[10px] text-muted-foreground">
                  Tap a sound to add a layer
                </span>
              )}
            </div>
          )}

          {/* Category Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5"
              )}
              style={{
                background: selectedCategory === 'all'
                  ? 'linear-gradient(180deg, hsl(260 60% 55%) 0%, hsl(260 60% 45%) 100%)'
                  : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)',
                border: `2px solid ${selectedCategory === 'all' ? 'hsl(260 50% 35%)' : 'hsl(var(--border))'}`,
                boxShadow: selectedCategory === 'all'
                  ? '0 2px 0 hsl(260 50% 30%), inset 0 1px 0 hsl(260 70% 70% / 0.2)'
                  : '0 2px 0 hsl(var(--border) / 0.4)',
                color: selectedCategory === 'all' ? 'white' : 'inherit',
              }}
            >
              ✨ All
            </button>
            {AMBIENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5"
                style={{
                  background: selectedCategory === cat.id
                    ? 'linear-gradient(180deg, hsl(260 60% 55%) 0%, hsl(260 60% 45%) 100%)'
                    : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)',
                  border: `2px solid ${selectedCategory === cat.id ? 'hsl(260 50% 35%)' : 'hsl(var(--border))'}`,
                  boxShadow: selectedCategory === cat.id
                    ? '0 2px 0 hsl(260 50% 30%), inset 0 1px 0 hsl(260 70% 70% / 0.2)'
                    : '0 2px 0 hsl(var(--border) / 0.4)',
                  color: selectedCategory === cat.id ? 'white' : 'inherit',
                }}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Free Sounds Section */}
          {freeSounds.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-1">
                Free Sounds
              </p>
              <div className="grid grid-cols-2 gap-2">
                {freeSounds.map((sound) => {
                  const isInLayers = layers.some(l => l.soundId === sound.id);
                  const isCurrentlyPlaying = isInLayers && isPlaying;

                  return (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound)}
                      className="relative p-3 rounded-xl text-left transition-all active:scale-[0.98]"
                      style={{
                        background: isCurrentlyPlaying
                          ? 'linear-gradient(180deg, hsl(140 40% 92%) 0%, hsl(140 35% 85%) 100%)'
                          : isInLayers
                          ? 'linear-gradient(180deg, hsl(260 40% 95%) 0%, hsl(260 30% 90%) 100%)'
                          : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)',
                        border: `2px solid ${isCurrentlyPlaying ? 'hsl(140 50% 55%)' : isInLayers ? 'hsl(260 50% 65%)' : 'hsl(var(--border))'}`,
                        boxShadow: isCurrentlyPlaying || isInLayers
                          ? '0 3px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.4)'
                          : '0 2px 0 hsl(var(--border) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-2xl">{sound.icon}</span>
                        {isCurrentlyPlaying && (
                          <div className="text-green-600 dark:text-green-400">
                            <SoundWaveBars isPlaying={true} small />
                          </div>
                        )}
                        {isInLayers && !isCurrentlyPlaying && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">{sound.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {sound.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Sounds Section */}
          {premiumSounds.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  Premium Sounds
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {premiumSounds.map((sound) => {
                  const isInLayers = layers.some(l => l.soundId === sound.id);
                  const isCurrentlyPlaying = isInLayers && isPlaying;
                  const isLocked = !isPremium;

                  return (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundSelect(sound)}
                      disabled={isLocked}
                      className={cn(
                        "relative p-3 rounded-xl text-left transition-all active:scale-[0.98]",
                        isLocked && "opacity-70"
                      )}
                      style={{
                        background: isCurrentlyPlaying
                          ? 'linear-gradient(180deg, hsl(140 40% 92%) 0%, hsl(140 35% 85%) 100%)'
                          : isInLayers
                          ? 'linear-gradient(180deg, hsl(260 40% 95%) 0%, hsl(260 30% 90%) 100%)'
                          : 'linear-gradient(180deg, hsl(40 60% 96%) 0%, hsl(35 50% 92%) 100%)',
                        border: `2px solid ${isCurrentlyPlaying ? 'hsl(140 50% 55%)' : isInLayers ? 'hsl(260 50% 65%)' : 'hsl(35 45% 75%)'}`,
                        boxShadow: '0 2px 0 hsl(var(--border) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.3)',
                      }}
                    >
                      {/* Lock/Crown Badge */}
                      <div
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md flex items-center justify-center"
                        style={{
                          background: isLocked
                            ? 'linear-gradient(180deg, hsl(45 80% 55%) 0%, hsl(40 75% 45%) 100%)'
                            : 'linear-gradient(180deg, hsl(45 90% 60%) 0%, hsl(40 85% 50%) 100%)',
                          border: '1.5px solid hsl(35 70% 40%)',
                          boxShadow: '0 1px 0 hsl(35 60% 30%)',
                        }}
                      >
                        {isLocked ? (
                          <Lock className="w-2.5 h-2.5 text-amber-900" />
                        ) : (
                          <Crown className="w-2.5 h-2.5 text-amber-900" />
                        )}
                      </div>

                      <div className="flex items-start justify-between mb-1">
                        <span className="text-2xl">{sound.icon}</span>
                        {isCurrentlyPlaying && (
                          <div className="text-green-600 dark:text-green-400">
                            <SoundWaveBars isPlaying={true} small />
                          </div>
                        )}
                        {isInLayers && !isCurrentlyPlaying && (
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">{sound.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {sound.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Upsell */}
          {!isPremium && (
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: 'linear-gradient(180deg, hsl(45 80% 92%) 0%, hsl(40 70% 87%) 100%)',
                border: '2px solid hsl(35 60% 65%)',
                boxShadow: '0 3px 0 hsl(35 50% 55%), inset 0 1px 0 hsl(50 100% 95% / 0.5)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, hsl(45 90% 60%) 0%, hsl(40 85% 50%) 100%)',
                    border: '2px solid hsl(35 70% 40%)',
                    boxShadow: '0 2px 0 hsl(35 60% 30%), inset 0 1px 0 hsl(50 100% 80% / 0.4)',
                  }}
                >
                  <Crown className="w-4 h-4 text-amber-900" />
                </div>
                <span className="text-sm font-bold text-amber-800">
                  Unlock Sound Mixing
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Mix multiple sounds together, plus unlock lo-fi beats, nature sounds, binaural waves, and more with Premium!
              </p>
              <button
                className="w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, hsl(260 60% 55%) 0%, hsl(260 60% 45%) 100%)',
                  border: '2px solid hsl(260 50% 35%)',
                  boxShadow: '0 3px 0 hsl(260 50% 30%), inset 0 1px 0 hsl(260 70% 70% / 0.2)',
                  color: 'white',
                }}
              >
                Learn More
              </button>
            </div>
          )}

          {/* Turn Off Button */}
          {layers.length > 0 && (
            <button
              onClick={() => stopAll()}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--muted) / 0.5) 0%, hsl(var(--muted) / 0.3) 100%)',
                border: '2px solid hsl(var(--border))',
                boxShadow: '0 2px 0 hsl(var(--border) / 0.4)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Turn Off Sound
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
