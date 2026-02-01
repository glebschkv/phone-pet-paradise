import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashScreen as NativeSplash } from '@capacitor/splash-screen';
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_BACKGROUNDS } from "@/data/ShopData";
import { useThemeStore, useShopStore } from "@/stores";

// Lazy load heavy components to reduce initial bundle size
const RetroPixelPlatform = lazy(() => import("@/components/retro/RetroPixelPlatform").then(m => ({ default: m.RetroPixelPlatform })));
const GameUI = lazy(() => import("@/components/GameUI").then(m => ({ default: m.GameUI })));
const OnboardingFlow = lazy(() => import("@/components/onboarding/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })));

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Map biome names to background theme IDs
const BIOME_TO_BACKGROUND: Record<string, string> = {
  'Meadow': 'day',
  'Sunset': 'sunset',
  'Night': 'night',
  'Forest': 'forest',
  'Snow': 'snow',
  'City': 'city',
  'Deep Ocean': 'deepocean',
};

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  useSupabaseData(); // Initialize Supabase data loading
  const { unlockedAnimals, currentLevel, currentBiome } = useBackendAppState();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  usePerformanceMonitor(); // Initialize performance monitoring

  // Hide splash screens once the Index page has mounted.
  // This runs AFTER: WKWebView load → React mount → lazy import → auth check,
  // so the splash stays visible through the entire cold start sequence.
  useEffect(() => {
    if (!isLoading) {
      NativeSplash.hide().catch(() => { /* Not on native */ });
      const htmlSplash = document.getElementById('splash-screen');
      if (htmlSplash) {
        htmlSplash.style.opacity = '0';
        setTimeout(() => htmlSplash.remove(), 350);
      }
    }
  }, [isLoading]);

  // Use Zustand stores instead of localStorage + events
  const backgroundTheme = useThemeStore((state) => state.homeBackground);
  const setHomeBackground = useThemeStore((state) => state.setHomeBackground);
  const equippedBackground = useShopStore((state) => state.equippedBackground);

  // Initialize background theme based on equipped background or biome
  useEffect(() => {
    // If there's an equipped premium background, use it
    if (equippedBackground) {
      const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === equippedBackground);
      if (background?.previewImage) {
        setHomeBackground(background.previewImage);
        return;
      }
    }

    // Otherwise, if background is still 'day' (default), set it based on current biome
    if (backgroundTheme === 'day' && currentBiome && currentBiome !== 'Meadow') {
      const biomeBackground = BIOME_TO_BACKGROUND[currentBiome] || 'day';
      setHomeBackground(biomeBackground);
    }
  }, [equippedBackground, currentBiome, backgroundTheme, setHomeBackground]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show splash screen while checking auth
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show auth button if not authenticated
  if (!isAuthenticated) {
    return (
      <PageErrorBoundary pageName="home page">
        <div className="h-screen w-full flex items-center justify-center bg-gradient-sky">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-primary">NoMo</h1>
            <p className="text-muted-foreground">Create an account to save your progress!</p>
            <Button onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <PageErrorBoundary pageName="home page">
        <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
          <Suspense fallback={<LoadingFallback />}>
            <OnboardingFlow onComplete={completeOnboarding} />
          </Suspense>
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary pageName="home page">
      <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
        {/* Retro Pixel Platform Scene */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <RetroPixelPlatform
              unlockedAnimals={unlockedAnimals}
              currentLevel={currentLevel}
              backgroundTheme={backgroundTheme}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Game UI Overlay */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <GameUI />
          </Suspense>
        </ErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
};

export default Index;
