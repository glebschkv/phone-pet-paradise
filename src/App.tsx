import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NativePluginProvider } from "@/contexts/NativePluginContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { PluginUnavailableBanner } from "@/components/PluginUnavailableBanner";
import { lazy, Suspense } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { VersionNotice } from "@/components/VersionNotice";

// Lazy load pages for better initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <NativePluginProvider>
        <OfflineProvider>
          <TooltipProvider>
            <Toaster />
            <PluginUnavailableBanner className="fixed top-0 left-0 right-0 z-50" />
            <VersionNotice />
            <BrowserRouter>
              <Suspense fallback={<SplashScreen />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </OfflineProvider>
      </NativePluginProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
