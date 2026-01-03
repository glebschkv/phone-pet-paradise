import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NativePluginProvider } from "@/contexts/NativePluginContext";
import { PluginUnavailableBanner } from "@/components/PluginUnavailableBanner";
import { lazy, Suspense } from "react";
import { HomePageSkeleton } from "@/components/ui/skeleton-loaders";

// Lazy load pages for better initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Page loading fallback with skeleton for better perceived performance
const PageLoadingFallback = () => (
  <div className="min-h-screen bg-background">
    <HomePageSkeleton className="h-screen" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <NativePluginProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PluginUnavailableBanner className="fixed top-0 left-0 right-0 z-50" />
          <BrowserRouter>
            <Suspense fallback={<PageLoadingFallback />}>
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
      </NativePluginProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
