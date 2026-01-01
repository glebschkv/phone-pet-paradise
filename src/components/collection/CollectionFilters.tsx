import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CollectionStats } from "./CollectionStats";

interface CollectionFiltersProps {
  activeTab: "pets" | "worlds";
  onTabChange: (tab: "pets" | "worlds") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  petsStats: {
    unlocked: number;
    total: number;
  };
  worldsStats: {
    unlocked: number;
    total: number;
  };
}

export const CollectionFilters = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  petsStats,
  worldsStats,
}: CollectionFiltersProps) => {
  return (
    <div className="retro-card mx-3 mt-3 overflow-hidden">
      {/* Tabs */}
      <div className="flex">
        <button
          onClick={() => onTabChange("pets")}
          className={cn(
            "flex-1 py-3 text-center font-bold text-sm transition-all",
            activeTab === "pets"
              ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-b-2 border-amber-500"
              : "text-muted-foreground hover:bg-muted/30"
          )}
        >
          <div>PETS</div>
          <CollectionStats unlocked={petsStats.unlocked} total={petsStats.total} />
        </button>
        <button
          onClick={() => onTabChange("worlds")}
          className={cn(
            "flex-1 py-3 text-center font-bold text-sm transition-all",
            activeTab === "worlds"
              ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-b-2 border-amber-500"
              : "text-muted-foreground hover:bg-muted/30"
          )}
        >
          <div>WORLDS</div>
          <CollectionStats unlocked={worldsStats.unlocked} total={worldsStats.total} />
        </button>
      </div>

      {/* Search */}
      {activeTab === "pets" && (
        <div className="p-3 border-t border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-2 border-border rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
