import { useState } from "react";
import { Timer, Home, Users, Grid3X3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "timer", icon: Timer, label: "Focus" },
  { id: "collection", icon: Grid3X3, label: "Collection" },
  { id: "friends", icon: Users, label: "Friends" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export const IOSTabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  const [pressedTab, setPressedTab] = useState<string | null>(null);

  // Simulate haptic feedback for iOS
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  };

  const handleTabPress = (tabId: string) => {
    setPressedTab(tabId);
    triggerHaptic();
  };

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      triggerHaptic();
      onTabChange(tabId);
    }
    setPressedTab(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* iOS-style blur backdrop with enhanced glass effect */}
      <div className="bg-card/70 backdrop-blur-3xl border-t border-border/30 shadow-tab-bar">
        <div className="pb-safe">
          <div className="flex items-center justify-around px-1 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPressed = pressedTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onTouchStart={() => handleTabPress(tab.id)}
                  onTouchEnd={() => setPressedTab(null)}
                  onMouseDown={() => handleTabPress(tab.id)}
                  onMouseUp={() => setPressedTab(null)}
                  onMouseLeave={() => setPressedTab(null)}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] min-h-[52px] p-2 rounded-2xl transition-all duration-150 ease-out",
                    "active:scale-90 touch-manipulation",
                    isPressed && "scale-90 bg-muted/40",
                    isActive && "bg-primary/10",
                    !isActive && "hover:bg-muted/30"
                  )}
                >
                  <Icon 
                    size={22} 
                    className={cn(
                      "transition-all duration-150 mb-1",
                      isActive ? "text-primary scale-110" : "text-muted-foreground",
                      isPressed && "scale-95"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-[10px] font-medium leading-none transition-all duration-150",
                      isActive ? "text-primary" : "text-muted-foreground/80"
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};