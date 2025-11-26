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
import { Sun, Sunset, Moon, Waves, TreePine, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const HOME_BACKGROUND_KEY = 'petIsland_homeBackground';

const HOME_BACKGROUNDS = [
  { id: 'day', name: 'Day', icon: Sun, unlockLevel: 1 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 3 },
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 5 },
  { id: 'ocean', name: 'Ocean', icon: Waves, unlockLevel: 8 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 12 },
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

  // Load background theme from localStorage (validate against unlock level)
  useEffect(() => {
    const savedTheme = localStorage.getItem(HOME_BACKGROUND_KEY);
    const theme = HOME_BACKGROUNDS.find(t => t.id === savedTheme);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(savedTheme);
    } else {
      // Fall back to highest unlocked theme
      const unlockedThemes = HOME_BACKGROUNDS.filter(t => t.unlockLevel <= currentLevel);
      if (unlockedThemes.length > 0) {
        setBackgroundTheme(unlockedThemes[unlockedThemes.length - 1].id);
      }
    }
  }, [currentLevel]);

  // Save background theme to localStorage (only if unlocked)
  const changeBackgroundTheme = (themeId: string) => {
    const theme = HOME_BACKGROUNDS.find(t => t.id === themeId);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(themeId);
      localStorage.setItem(HOME_BACKGROUND_KEY, themeId);
    }
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
            const isLocked = theme.unlockLevel > currentLevel;
            return (
              <button
                key={theme.id}
                onClick={() => !isLocked && changeBackgroundTheme(theme.id)}
                disabled={isLocked}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  isLocked
                    ? "opacity-40 cursor-not-allowed"
                    : "active:scale-95",
                  isSelected && !isLocked
                    ? "ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
                    : !isLocked && "opacity-60 hover:opacity-90"
                )}
                style={{
                  background: isLocked
                    ? 'hsl(var(--muted) / 0.5)'
                    : isSelected
                      ? 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)'
                      : 'hsl(var(--card) / 0.5)',
                  border: '2px solid hsl(var(--border) / 0.8)',
                  boxShadow: isSelected && !isLocked
                    ? '0 2px 0 hsl(var(--border) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : '0 1px 0 hsl(var(--border) / 0.3)'
                }}
                title={isLocked ? `Unlock at Lv.${theme.unlockLevel}` : theme.name}
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Icon className={cn(
                    "w-4 h-4",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )} />
                )}
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
