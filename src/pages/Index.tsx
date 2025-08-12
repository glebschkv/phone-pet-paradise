import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useOnboarding } from "@/hooks/useOnboarding";

const Index = () => {
  const { unlockedAnimals, currentLevel, currentBiome } = useAppStateTracking();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  
  // Show loading state while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-sky">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Pet Paradise...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
        <OnboardingFlow onComplete={completeOnboarding} />
      </div>
    );
  }
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
      {/* 3D Island Scene */}
      <ErrorBoundary>
<Island3D 
  totalPets={unlockedAnimals.length} 
  isAppActive={true} 
  currentLevel={currentLevel} 
  unlockedAnimals={unlockedAnimals}
  currentBiome={currentBiome}
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
