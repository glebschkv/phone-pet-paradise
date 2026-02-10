/**
 * GlobalSoundToggle
 *
 * A small floating pill that appears above the tab bar when ambient sounds
 * are configured. Allows play/pause from any page without navigating to
 * the timer. Uses the same useSoundMixer hook as AmbientSoundPicker.
 */

import { Volume2, VolumeX } from 'lucide-react';
import { useSoundMixer } from '@/hooks/useSoundMixer';
import { cn } from '@/lib/utils';

interface GlobalSoundToggleProps {
  /** Hide when on the timer tab (timer has its own sound controls) */
  currentTab: string;
}

export const GlobalSoundToggle = ({ currentTab }: GlobalSoundToggleProps) => {
  const { layers, isPlaying, toggle, getLayerDetails } = useSoundMixer();

  // Don't show if no sounds configured, or if on timer (timer has its own picker)
  if (layers.length === 0 || currentTab === 'timer') return null;

  const layerDetails = getLayerDetails();
  const primaryName = layerDetails.length > 0 ? layerDetails[0].sound?.name : null;
  const label = layerDetails.length > 1
    ? `${layerDetails.length} Sounds`
    : primaryName || 'Sound';

  return (
    <button
      onClick={toggle}
      className={cn(
        "pointer-events-auto absolute right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95",
        "backdrop-blur-md shadow-lg border",
        isPlaying
          ? "bg-green-500/20 border-green-400/40 text-green-300"
          : "bg-black/30 border-white/15 text-white/60"
      )}
      style={{
        bottom: 90, // Above the tab bar
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
        zIndex: 51,
      }}
      aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
    >
      {isPlaying ? (
        <Volume2 className="w-3.5 h-3.5" />
      ) : (
        <VolumeX className="w-3.5 h-3.5" />
      )}
      <span className="text-[11px] font-semibold max-w-[80px] truncate">
        {label}
      </span>
    </button>
  );
};
