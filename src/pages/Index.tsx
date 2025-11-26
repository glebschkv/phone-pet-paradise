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
import { Sun, Sunset, Moon, Waves, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

const HOME_BACKGROUNDS = [
  { id: 'day', name: 'Day', icon: Sun },
  { id: 'sunset', name: 'Sunset', icon: Sunset },
  { id: 'night', name: 'Night', icon: Moon },
  { id: 'ocean', name: 'Ocean', icon: Waves },
  { id: 'forest', name: 'Forest', icon: TreePine },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const { profile, progress, pets } = useSupabaseData();
  const { unlockedAnimals, currentLevel, currentBiome } = useBackendAppState();
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const { performanceLevel } = usePerformanceMonitor();
  const { autoBackup } = useDataBackup();
  const [backgroundTheme, setBackgroundTheme] = useState<string>('day');

  // Load background theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(HOME_BACKGROUND_KEY);
    if (savedTheme && HOME_BACKGROUNDS.some(t => t.id === savedTheme)) {
      setBackgroundTheme(savedTheme);
    }
  }, []);

  // Save background theme to localStorage
  const changeBackgroundTheme = (themeId: string) => {
    setBackgroundTheme(themeId);
    localStorage.setItem(HOME_BACKGROUND_KEY, themeId);
  };

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

      {/* Background Theme Switcher - Bottom left above taskbar */}
      <div className="absolute bottom-24 left-3 z-20">
        <div className="flex flex-col gap-1.5">
          {HOME_BACKGROUNDS.map((theme) => {
            const Icon = theme.icon;
            const isSelected = backgroundTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => changeBackgroundTheme(theme.id)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95",
                  isSelected
                    ? "ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
                    : "opacity-50 hover:opacity-80"
                )}
                style={{
                  background: isSelected
                    ? 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)'
                    : 'hsl(var(--card) / 0.5)',
                  border: '2px solid hsl(var(--border) / 0.8)',
                  boxShadow: isSelected
                    ? '0 2px 0 hsl(var(--border) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : '0 1px 0 hsl(var(--border) / 0.3)'
                }}
                title={theme.name}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Game UI Overlay */}
      <ErrorBoundary>
        <GameUI />
      </ErrorBoundary>
    </div>
  );
};

export default Index;
