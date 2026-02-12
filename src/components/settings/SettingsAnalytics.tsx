import { useAnalytics } from "@/hooks/useAnalytics";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Target, Calendar, BarChart3, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const SettingsAnalytics = () => {
  const { settings, updateSettings, resetAnalytics, formatDuration } = useAnalytics();

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all analytics data? This cannot be undone.")) {
      resetAnalytics();
      toast.success("Analytics data has been reset");
    }
  };

  return (
    <div className="space-y-3">
      {/* Daily Goal */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Goals</Label>
        </div>

        <div className="space-y-5">
          {/* Daily Focus Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-level-badge rounded-md flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">Daily Goal</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {formatDuration(settings.dailyGoalMinutes * 60)}
              </span>
            </div>
            <Slider
              min={30}
              max={480}
              step={15}
              value={[settings.dailyGoalMinutes]}
              onValueChange={([value]) => updateSettings({ dailyGoalMinutes: value })}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>30m</span>
              <span>8h</span>
            </div>
          </div>

          {/* Weekly Focus Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-stat-pill rounded-md flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold">Weekly Goal</span>
              </div>
              <span className="text-sm font-bold">
                {formatDuration(settings.weeklyGoalMinutes * 60)}
              </span>
            </div>
            <Slider
              min={60}
              max={2400}
              step={60}
              value={[settings.weeklyGoalMinutes]}
              onValueChange={([value]) => updateSettings({ weeklyGoalMinutes: value })}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>1h</span>
              <span>40h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Options */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Tracking</Label>
        </div>

        <div className="space-y-4">
          {/* Show Insights */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                settings.showInsights ? "retro-level-badge" : "retro-stat-pill"
              )}>
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-sm font-bold">Show Insights</Label>
                <p className="text-[11px] text-muted-foreground">Display productivity insights</p>
              </div>
            </div>
            <Switch
              checked={settings.showInsights}
              onCheckedChange={(checked) => updateSettings({ showInsights: checked })}
            />
          </div>

          {/* Track Session History */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                settings.trackSessionHistory ? "retro-level-badge" : "retro-stat-pill"
              )}>
                <History className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-sm font-bold">Session History</Label>
                <p className="text-[11px] text-muted-foreground">Keep detailed session logs</p>
              </div>
            </div>
            <Switch
              checked={settings.trackSessionHistory}
              onCheckedChange={(checked) => updateSettings({ trackSessionHistory: checked })}
            />
          </div>
        </div>
      </div>

      {/* Reset Analytics */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <Label className="text-sm font-bold">Reset Analytics</Label>
              <p className="text-[11px] text-muted-foreground">Clear all tracked data</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
