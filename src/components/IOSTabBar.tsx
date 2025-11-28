import { useState, useCallback } from "react";
import { Timer, Home, ShoppingBag, Grid3X3, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Tab configuration with notification support
const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "timer", icon: Timer, label: "Focus", isCenter: true },
  { id: "collection", icon: Grid3X3, label: "Pets" },
  { id: "shop", icon: ShoppingBag, label: "Shop" },
  { id: "settings", icon: Settings, label: "Settings" },
];

// Reorder tabs so timer is in center
const orderedTabs = [
  tabs[0], // Home
  tabs[2], // Collection
  tabs[1], // Timer (center)
  tabs[3], // Shop
  tabs[4], // Settings
];

export const IOSTabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  // Enhanced haptic feedback
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 1, medium: 5, heavy: 10 };
      navigator.vibrate(patterns[intensity]);
    }
  }, []);

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    triggerHaptic('light');
  };

  const handleTabRelease = () => {
    setPressedTab(null);
  };

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      triggerHaptic('medium');
      onTabChange(tabId);
    }
    setPressedTab(null);
  };

  return (
    <div className="dock-container">
      <nav className="dock-bar" role="tablist" aria-label="Main navigation">
        {orderedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPressed = pressedTab === tab.id;
          const isCenter = tab.isCenter;

          // Center button (Focus/Timer) - special styling
          if (isCenter) {
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onTouchStart={() => handleTabPress(tab.id)}
                onTouchEnd={handleTabRelease}
                onMouseDown={() => handleTabPress(tab.id)}
                onMouseUp={handleTabRelease}
                onMouseLeave={handleTabRelease}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "dock-center-btn touch-manipulation",
                  isActive && "active",
                  isPressed && "scale-95"
                )}
              >
                <Icon className="dock-item-icon" strokeWidth={2.5} />
                {/* Sparkle effect when active */}
                {isActive && (
                  <Sparkles
                    className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse"
                    strokeWidth={2}
                  />
                )}
              </button>
            );
          }

          // Regular tab items
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onTouchStart={() => handleTabPress(tab.id)}
              onTouchEnd={handleTabRelease}
              onMouseDown={() => handleTabPress(tab.id)}
              onMouseUp={handleTabRelease}
              onMouseLeave={handleTabRelease}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "dock-item touch-manipulation",
                isActive && "active",
                isPressed && "scale-90"
              )}
            >
              <Icon className="dock-item-icon" strokeWidth={isActive ? 2.5 : 2} />
              <span className="dock-item-label">{tab.label}</span>

              {/* Active indicator dot */}
              <span className="dock-active-dot" />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
