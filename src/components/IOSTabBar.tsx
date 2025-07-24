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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* iOS-style blur backdrop */}
      <div className="bg-card/80 backdrop-blur-xl border-t border-border">
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPressed = pressedTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onMouseDown={() => setPressedTab(tab.id)}
                  onMouseUp={() => setPressedTab(null)}
                  onMouseLeave={() => setPressedTab(null)}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-1 rounded-lg transition-all duration-200",
                    "active:scale-95 hover:bg-muted/50",
                    isPressed && "scale-95 bg-muted/70",
                    isActive && "text-primary"
                  )}
                >
                  <Icon 
                    size={24} 
                    className={cn(
                      "transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-xs font-medium mt-1 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
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