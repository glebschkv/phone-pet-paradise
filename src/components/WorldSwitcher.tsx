import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, ChevronDown } from "lucide-react";

interface WorldSwitcherProps {
  currentBiome: string;
  availableBiomes: string[];
  onSwitch: (biomeName: string) => void;
}

export const WorldSwitcher = ({ currentBiome, availableBiomes, onSwitch }: WorldSwitcherProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="biome-selector touch-manipulation">
          <MapPin className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-semibold text-foreground">{currentBiome}</span>
          <ChevronDown className="w-3.5 h-3.5 text-foreground/40 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem] biome-dropdown">
        {availableBiomes.map((biome) => (
          <DropdownMenuItem
            key={biome}
            onClick={() => onSwitch(biome)}
            className={`biome-option ${biome === currentBiome ? 'active' : ''}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {biome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
