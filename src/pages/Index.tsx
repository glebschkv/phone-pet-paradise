import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashScreen as NativeSplash } from '@capacitor/splash-screen';
import { DeviceActivity } from '@/plugins/device-activity';
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

import { useAuth } from "@/hooks/useAuth";
import { useWidgetSync } from "@/hooks/useWidgetSync";
import { useTimerExpiryGuard } from "@/hooks/useTimerExpiryGuard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PREMIUM_BACKGROUNDS } from "@/data/ShopData";
import { useThemeStore, useShopStore } from "@/stores";

// Lazy load heavy components to reduce initial bundle size
const RetroPixelPlatform = lazy(() => import("@/components/retro/RetroPixelPlatform").then(m => ({ default: m.RetroPixelPlatform })));
const GameUI = lazy(() => import("@/components/GameUI").then(m => ({ default: m.GameUI })));
const OnboardingFlow = lazy(() => import("@/components/onboarding/OnboardingFlow").then(m => ({ default: m.OnboardingFlow })));

// Loading fallback for lazy-loaded components — larger and more visible on mobile
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-full w-full gap-3">
    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary"></div>
    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

// Module-level guard: survives component remounts (Suspense re-resolution,
// route transitions) so the native splash is only ever hidden once.
let _splashHidden = false;

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
  // Data loading is handled inside useBackendAppState (which calls useSupabaseData internally)
  const { unlockedAnimals, currentLevel, currentBiome, isLoading: isDataLoading } = useBackendAppState();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  usePerformanceMonitor(); // Initialize performance monitoring
  useWidgetSync(); // Initialize widget data sync + foreground re-sync
  useTimerExpiryGuard(); // Stop app blocking if timer expired while component was unmounted

  // Hide splash screens once after auth check resolves.
  // Module-level _splashHidden survives component remounts (Suspense, route
  // changes) so the native bridge call only fires once per app session.
  // Sequence: hide native splash first (reveals HTML neon splash underneath),
  // then fade the HTML splash after a brief delay so users see the branded
  // loading screen instead of an instant jump to content.
  useEffect(() => {
    if (!isLoading && !_splashHidden) {
      _splashHidden = true;
      // 1. Dismiss the native animated splash (AnimatedSplashViewController)
      //    which fades out with a 0.4s animation revealing the web content.
      DeviceActivity.dismissSplash().catch(() => { /* Not on native */ });
      // 2. Also hide Capacitor's built-in splash overlay
      NativeSplash.hide().catch(() => { /* Not on native */ });
      // 3. Fade the HTML splash (fallback for web / first-paint coverage)
      const htmlSplash = document.getElementById('splash-screen');
      if (htmlSplash) {
        htmlSplash.style.opacity = '0';
        setTimeout(() => htmlSplash.remove(), 400);
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
    if (backgroundTheme === 'day' && currentBiome && currentBiome !== 'Snow') {
      const biomeBackground = BIOME_TO_BACKGROUND[currentBiome] || 'snow';
      setHomeBackground(biomeBackground);
    }
    // Set snow as default for new users (Snow is the starting biome)
    if (backgroundTheme === 'day' && (!currentBiome || currentBiome === 'Snow')) {
      setHomeBackground('snow');
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

  // Show loading state while backend data initializes after auth.
  // Without this gate the app renders with empty arrays/nulls, causing a
  // visible flash of blank content before data arrives from Supabase.
  if (isDataLoading) {
    return (
      <PageErrorBoundary pageName="home page">
        <div className="h-screen w-full flex items-center justify-center bg-gradient-sky">
          <LoadingFallback />
        </div>
      </PageErrorBoundary>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    const handleOnboardingComplete = () => {
      completeOnboarding();
    };

    return (
      <PageErrorBoundary pageName="home page">
        <div className="h-screen w-full overflow-hidden bg-gradient-sky relative max-w-screen">
          <Suspense fallback={<LoadingFallback />}>
            <OnboardingFlow onComplete={handleOnboardingComplete} />
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
