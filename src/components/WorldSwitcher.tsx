import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe2 } from "lucide-react";

interface WorldSwitcherProps {
  currentBiome: string;
  availableBiomes: string[];
  onSwitch: (biomeName: string) => void;
}

export const WorldSwitcher = ({ currentBiome, availableBiomes, onSwitch }: WorldSwitcherProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe2 className="w-4 h-4" />
          {currentBiome}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuLabel>Worlds</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableBiomes.map((biome) => (
          <DropdownMenuItem 
            key={biome}
            onClick={() => onSwitch(biome)}
            className={biome === currentBiome ? "font-semibold" : ""}
          >
            {biome}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
