import { Island3D } from "@/components/Island3D";
import { GameUI } from "@/components/GameUI";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Enhanced3DErrorBoundary } from "@/components/Enhanced3DErrorBoundary";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useDataBackup } from "@/hooks/useDataBackup";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { profile, progress, pets } = useSupabaseData();
  const { unlockedAnimals, currentLevel, currentBiome } = useAppStateTracking();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const { performanceLevel } = usePerformanceMonitor();
  const { autoBackup } = useDataBackup();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Auto backup on app start
  useEffect(() => {
    autoBackup();
  }, [autoBackup]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-sky">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Pet Paradise...</p>
        </div>
      </div>
    );
  }

  // Show auth button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-sky">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Pet Island Paradise</h1>
          <p className="text-muted-foreground">Create an account to save your progress!</p>
          <Button onClick={() => navigate('/auth')}>Get Started</Button>
        </div>
      </div>
    );
  }
  
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
      <Enhanced3DErrorBoundary enableDiagnostics={true}>
        <Island3D 
          totalPets={unlockedAnimals.length} 
          isAppActive={true} 
          currentLevel={currentLevel} 
          unlockedAnimals={unlockedAnimals}
          currentBiome={currentBiome}
        />
      </Enhanced3DErrorBoundary>
      
      {/* Game UI Overlay */}
      <ErrorBoundary>
        <GameUI />
      </ErrorBoundary>
    </div>
  );
};

export default Index;
