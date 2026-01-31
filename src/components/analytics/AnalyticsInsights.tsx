import {
  Lightbulb,
  TrendingUp,
  Clock,
  Flame,
  Target,
  CheckCircle,
  LayoutGrid,
  Trophy,
  Shield,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsInsight } from "@/types/analytics";

interface InsightsProps {
  insights: AnalyticsInsight[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Clock,
  Flame,
  Target,
  CheckCircle,
  LayoutGrid,
  Trophy,
  Shield,
  AlertCircle,
};

const TYPE_STYLES: Record<string, { bg: string; border: string }> = {
  achievement: { bg: 'bg-green-500/8', border: 'border-green-500/20' },
  improvement: { bg: 'bg-blue-500/8', border: 'border-blue-500/20' },
  recommendation: { bg: 'bg-amber-500/8', border: 'border-amber-500/20' },
  trend: { bg: 'bg-purple-500/8', border: 'border-purple-500/20' },
};

export const AnalyticsInsights = ({ insights }: InsightsProps) => {
  if (insights.length === 0) {
    return (
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold">Smart Insights</span>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Insights will appear as you build data</p>
          <p className="text-xs mt-1">Complete more sessions to unlock personalized recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold">Smart Insights</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{insights.length} active</span>
      </div>

      <div className="space-y-2">
        {insights.map(insight => {
          const IconComponent = ICON_MAP[insight.icon] || Lightbulb;
          const styles = TYPE_STYLES[insight.type] || TYPE_STYLES.trend;

          return (
            <div
              key={insight.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                styles.bg,
                styles.border,
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                insight.color,
                insight.type === 'achievement' ? 'bg-green-500/15' :
                insight.type === 'recommendation' ? 'bg-amber-500/15' :
                'bg-primary/10'
              )}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">{insight.title}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {insight.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
