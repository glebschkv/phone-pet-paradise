import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface WorldTransitionContextValue {
  isWorldLoading: boolean;
  targetBiome: string | null;
  startWorldTransition: (biome: string, action: () => void) => void;
}

const WorldTransitionContext = createContext<WorldTransitionContextValue | undefined>(undefined);

export const WorldTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWorldLoading, setIsWorldLoading] = useState(false);
  const [targetBiome, setTargetBiome] = useState<string | null>(null);

  const startWorldTransition = useCallback((biome: string, action: () => void) => {
    setTargetBiome(biome);
    setIsWorldLoading(true);

    // Allow UI to show the overlay before switching
    requestAnimationFrame(() => {
      // Execute the biome switch
      action();

      // Keep overlay visible briefly to allow 3D assets to mount
      setTimeout(() => {
        setIsWorldLoading(false);
        setTargetBiome(null);
      }, 800);
    });
  }, []);

  const value = useMemo(() => ({ isWorldLoading, targetBiome, startWorldTransition }), [isWorldLoading, targetBiome, startWorldTransition]);

  return (
    <WorldTransitionContext.Provider value={value}>
      {children}
    </WorldTransitionContext.Provider>
  );
};

export const useWorldTransition = () => {
  const ctx = useContext(WorldTransitionContext);
  if (!ctx) throw new Error("useWorldTransition must be used within WorldTransitionProvider");
  return ctx;
};
