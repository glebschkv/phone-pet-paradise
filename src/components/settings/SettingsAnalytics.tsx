import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, Calendar, BarChart3, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const SettingsAnalytics = () => {
  const { settings, updateSettings, resetAnalytics, formatDuration } = useAnalytics();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleReset = () => {
    resetAnalytics();
    toast.success("Analytics data has been reset");
    setResetDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Daily Goal */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">GOALS</span>
        </div>

        <div className="space-y-5">
          {/* Daily Focus Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-level-badge rounded-md flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">Daily Goal</span>
              </div>
              <span className="text-sm font-bold retro-pixel-text retro-neon-text">
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
            <div className="flex justify-between text-[11px] text-purple-300/60 mt-1">
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
                <span className="text-xs font-semibold text-white">Weekly Goal</span>
              </div>
              <span className="text-sm font-bold retro-pixel-text text-purple-300">
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
            <div className="flex justify-between text-[11px] text-purple-300/60 mt-1">
              <span>1h</span>
              <span>40h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Options */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">TRACKING</span>
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
                <Label className="text-sm font-bold text-white">Show Insights</Label>
                <p className="text-[11px] text-purple-300/80">Display productivity insights</p>
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
                <Label className="text-sm font-bold text-white">Session History</Label>
                <p className="text-[11px] text-purple-300/80">Keep detailed session logs</p>
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
      <div className="retro-game-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/30">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <Label className="text-sm font-bold text-white">Reset Analytics</Label>
              <p className="text-[11px] text-purple-300/80">Clear all tracked data</p>
            </div>
          </div>
          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <button
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold transition-all active:scale-95"
              >
                Reset
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="retro-game-card border-2 border-purple-600/50 max-w-xs mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold text-white">Reset Analytics?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-purple-300/80">
                  Are you sure you want to reset all analytics data? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="retro-stat-pill px-3 py-2 text-xs font-semibold">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-500 text-white px-3 py-2 text-xs font-bold rounded-lg"
                  style={{ boxShadow: '0 2px 0 rgba(185,28,28,0.8)' }}
                >
                  Reset Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
