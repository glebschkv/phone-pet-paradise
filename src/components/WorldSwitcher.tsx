import { Button } from "@/components/ui/button";
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
        <button className="retro-stat-pill flex items-center gap-2 px-3 py-1.5 hover:brightness-95 active:scale-95 transition-all touch-manipulation">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground">{currentBiome}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] retro-card border-2 border-border p-1">
        {availableBiomes.map((biome) => (
          <DropdownMenuItem
            key={biome}
            onClick={() => onSwitch(biome)}
            className={`rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
              biome === currentBiome
                ? "bg-primary/10 font-semibold text-primary"
                : "hover:bg-muted/50"
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 mr-2 ${biome === currentBiome ? 'text-primary' : 'text-muted-foreground'}`} />
            {biome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
