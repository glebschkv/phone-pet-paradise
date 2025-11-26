import { useState } from "react";
import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Upload, RotateCcw, Shield, AlertTriangle, FileJson } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDataProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export const SettingsData = ({ settings, onUpdate, onReset, onExport, onImport }: SettingsDataProps) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!importFile) return;

    try {
      await onImport(importFile);
      setImportFile(null);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON settings file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Privacy Settings */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-level-badge rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <Label className="text-sm font-bold">Privacy</Label>
            <p className="text-[10px] text-muted-foreground">Control data collection</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
            <div>
              <Label className="text-xs font-semibold">Anonymous Usage Data</Label>
              <p className="text-[10px] text-muted-foreground">Help improve the app</p>
            </div>
            <Switch
              checked={settings.dataCollection}
              onCheckedChange={(checked) => onUpdate({ dataCollection: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div>
                <Label className="text-xs font-semibold">Crash Reporting</Label>
                <p className="text-[10px] text-muted-foreground">Send crash reports</p>
              </div>
            </div>
            <Switch
              checked={settings.crashReporting}
              onCheckedChange={(checked) => onUpdate({ crashReporting: checked })}
            />
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-stat-pill rounded-lg flex items-center justify-center">
            <FileJson className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <Label className="text-sm font-bold">Backup & Restore</Label>
            <p className="text-[10px] text-muted-foreground">Export or import your settings</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onExport}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold">Export Settings</span>
          </button>

          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer h-12 file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold"
            />
          </div>

          {importFile && (
            <button
              onClick={handleImport}
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-2 border-amber-500"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-bold">Import "{importFile.name}"</span>
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="retro-card p-4 border-2 border-destructive/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/10 border-2 border-destructive/30">
            <RotateCcw className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <Label className="text-sm font-bold text-destructive">Danger Zone</Label>
            <p className="text-[10px] text-muted-foreground">Irreversible actions</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-destructive/10 text-destructive border-2 border-destructive/30 hover:bg-destructive/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-bold">Reset All Settings</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="retro-card border-2 border-border max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">Reset All Settings?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                This will reset all settings to defaults. This action cannot be undone. Consider exporting your settings first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="retro-stat-pill px-4 py-2 text-sm font-semibold">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onReset}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-sm font-bold rounded-lg"
              >
                Reset Settings
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
