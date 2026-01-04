/**
 * TabContent Component
 *
 * Renders the content for each tab with lazy loading and context-aware skeletons.
 * Extracts tab rendering logic from GameUI for better separation of concerns.
 */

import { lazy, Suspense } from "react";
import {
  TimerDisplaySkeleton,
  CollectionPageSkeleton,
  ShopPageSkeleton,
  SettingsSectionSkeleton,
  AchievementGridSkeleton,
} from "@/components/ui/skeleton-loaders";

// Lazy load heavy tab components for better initial load performance
const UnifiedFocusTimer = lazy(() => import("@/components/UnifiedFocusTimer").then(m => ({ default: m.UnifiedFocusTimer })));
const PetCollectionGrid = lazy(() => import("@/components/PetCollectionGrid").then(m => ({ default: m.PetCollectionGrid })));
const Settings = lazy(() => import("@/components/Settings").then(m => ({ default: m.Settings })));
const Shop = lazy(() => import("@/components/Shop").then(m => ({ default: m.Shop })));
const GamificationHub = lazy(() => import("@/components/gamification").then(m => ({ default: m.GamificationHub })));

// Context-aware loading skeleton based on tab
const getTabSkeleton = (tab: string) => {
  switch (tab) {
    case "timer":
      return <TimerDisplaySkeleton />;
    case "collection":
      return <CollectionPageSkeleton />;
    case "shop":
      return <ShopPageSkeleton />;
    case "settings":
      return <SettingsSectionSkeleton rows={5} />;
    case "challenges":
      return <AchievementGridSkeleton count={4} />;
    default:
      return null;
  }
};

interface TabContentProps {
  currentTab: string;
  onXPReward: (amount: number) => void;
  onCoinReward: (amount: number) => void;
}

export const TabContent = ({ currentTab, onXPReward, onCoinReward }: TabContentProps) => {
  const renderTabContent = () => {
    switch (currentTab) {
      case "timer":
        return <UnifiedFocusTimer />;
      case "collection":
        return <PetCollectionGrid />;
      case "challenges":
        return <GamificationHub onXPReward={onXPReward} onCoinReward={onCoinReward} />;
      case "shop":
        return <Shop />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  const content = renderTabContent();

  if (!content) {
    return null;
  }

  return (
    <Suspense fallback={getTabSkeleton(currentTab)}>
      {content}
    </Suspense>
  );
};
