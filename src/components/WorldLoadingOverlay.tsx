import { useWorldTransition } from "@/context/WorldTransitionContext";

export const WorldLoadingOverlay = () => {
  const { isWorldLoading, targetBiome } = useWorldTransition();

  if (!isWorldLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="bg-gradient-glass backdrop-blur-xl border border-primary/10 rounded-3xl px-6 py-5 shadow-floating">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" aria-hidden />
          <div className="text-sm">
            <p className="font-medium">Traveling to {targetBiome ?? "new world"}...</p>
            <p className="text-muted-foreground text-xs">Loading island and wildlife</p>
          </div>
        </div>
      </div>
    </div>
  );
};
