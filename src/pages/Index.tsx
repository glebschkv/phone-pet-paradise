import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";

const Index = () => {
  const { unlockedAnimals, currentLevel } = useAppStateTracking();
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
      {/* 3D Island Scene */}
      <ErrorBoundary>
        <Island3D 
          totalPets={unlockedAnimals.length} 
          isAppActive={true} 
          currentLevel={currentLevel} 
          unlockedAnimals={unlockedAnimals}
        />
      </ErrorBoundary>
      
      {/* Game UI Overlay */}
      <ErrorBoundary>
        <GameUI />
      </ErrorBoundary>
    </div>
  );
};

export default Index;
