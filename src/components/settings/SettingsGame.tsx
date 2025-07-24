import { AppSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gamepad2, Zap, HelpCircle, Save } from "lucide-react";

interface SettingsGameProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const animationSpeedOptions = [
  { value: "slow", label: "Slow", description: "Relaxed animations for better focus" },
  { value: "normal", label: "Normal", description: "Balanced animation speed" },
  { value: "fast", label: "Fast", description: "Quick animations for efficiency" },
];

export const SettingsGame = ({ settings, onUpdate }: SettingsGameProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Game Settings
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Customize your gameplay experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Animation & Performance</CardTitle>
          <CardDescription>
            Control visual effects and responsiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="animation-speed" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Animation Speed
            </Label>
            <Select
              value={settings.animationSpeed}
              onValueChange={(value) => onUpdate({ animationSpeed: value as 'slow' | 'normal' | 'fast' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select animation speed" />
              </SelectTrigger>
              <SelectContent>
                {animationSpeedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistance</CardTitle>
          <CardDescription>
            Tutorial and help options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="tutorial-hints" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Show Tutorial Hints
              </Label>
              <p className="text-sm text-muted-foreground">
                Display helpful tips and guidance
              </p>
            </div>
            <Switch
              id="tutorial-hints"
              checked={settings.showTutorialHints}
              onCheckedChange={(checked) => onUpdate({ showTutorialHints: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            How your progress is saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-save" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Auto-Save Progress
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your game progress
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={settings.autoSaveProgress}
              onCheckedChange={(checked) => onUpdate({ autoSaveProgress: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};