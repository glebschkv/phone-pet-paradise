import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleAnalyticsSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleAnalyticsSection = ({
  title,
  icon,
  badge,
  defaultOpen = true,
  children,
}: CollapsibleAnalyticsSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(defaultOpen ? "auto" : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      const timer = setTimeout(() => setHeight("auto"), 300);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [isOpen]);

  return (
    <div className="space-y-0">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all active:scale-[0.99]",
          isOpen
            ? "bg-muted/20 mb-2"
            : "bg-muted/10 hover:bg-muted/20"
        )}
      >
        <span className="flex-shrink-0 text-primary">{icon}</span>
        <span className="text-sm font-bold flex-1 text-left">{title}</span>
        {badge && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible content — children keep their own card styling */}
      <div
        ref={contentRef}
        className="transition-[height] duration-300 ease-in-out overflow-hidden"
        style={{ height: height === "auto" ? "auto" : `${height}px` }}
      >
        {children}
      </div>
    </div>
  );
};
