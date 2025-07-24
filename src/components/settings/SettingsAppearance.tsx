import { AppSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Monitor, Sun, Moon } from "lucide-react";

interface SettingsAppearanceProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, description: "Always use light theme" },
  { value: "dark", label: "Dark", icon: Moon, description: "Always use dark theme" },
  { value: "system", label: "System", icon: Monitor, description: "Follow system preference" },
];

const colorOptions = [
  { value: "default", label: "Ocean Blue", preview: "bg-blue-500" },
  { value: "emerald", label: "Emerald", preview: "bg-emerald-500" },
  { value: "purple", label: "Purple", preview: "bg-purple-500" },
  { value: "rose", label: "Rose", preview: "bg-rose-500" },
  { value: "orange", label: "Orange", preview: "bg-orange-500" },
];

export const SettingsAppearance = ({ settings, onUpdate }: SettingsAppearanceProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Customize how the app looks and feels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) => onUpdate({ theme: value as 'light' | 'dark' | 'system' })}
            className="grid grid-cols-1 gap-4"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex items-center space-x-3 flex-1">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose your preferred accent color
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.primaryColor}
            onValueChange={(value) => onUpdate({ primaryColor: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${color.preview}`} />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};