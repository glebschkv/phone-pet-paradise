import { RetroPixelPlatform } from "@/components/retro/RetroPixelPlatform";
import { GameUI } from "@/components/GameUI";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useDataBackup } from "@/hooks/useDataBackup";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Forest': 'forest',
  'Snow': 'snow',
  'City': 'city',
  'Ruins': 'ruins',
  'Deep Ocean': 'deepocean',
};

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  useSupabaseData(); // Initialize Supabase data loading
  const { unlockedAnimals, currentLevel, currentBiome } = useBackendAppState();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  usePerformanceMonitor(); // Initialize performance monitoring
  const { autoBackup } = useDataBackup(); // Initialize auto-backup
  const [backgroundTheme, setBackgroundTheme] = useState<string>('day');

  // Load background theme from localStorage or derive from current biome
  useEffect(() => {
    const savedTheme = localStorage.getItem(HOME_BACKGROUND_KEY);
    if (savedTheme) {
      setBackgroundTheme(savedTheme);
    } else if (currentBiome) {
      // Initialize background based on current biome
      const biomeBackground = BIOME_TO_BACKGROUND[currentBiome] || 'day';
      setBackgroundTheme(biomeBackground);
      localStorage.setItem(HOME_BACKGROUND_KEY, biomeBackground);
    }

    // Listen for background theme changes from Collection page
    const handleThemeChange = (event: CustomEvent<string>) => {
      setBackgroundTheme(event.detail);
    };

    window.addEventListener('homeBackgroundChange', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('homeBackgroundChange', handleThemeChange as EventListener);
    };
  }, [currentBiome]);

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
      {/* Retro Pixel Platform Scene */}
      <ErrorBoundary>
        <RetroPixelPlatform
          unlockedAnimals={unlockedAnimals}
          currentLevel={currentLevel}
          backgroundTheme={backgroundTheme}
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
