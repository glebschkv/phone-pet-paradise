import { useState } from "react";
import { settingsLogger } from "@/lib/logger";
import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Download, Upload, RotateCcw, Shield, AlertTriangle, HardDrive } from "lucide-react";
import { toast } from 'sonner';

interface SettingsDataProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export const SettingsData = ({ settings, onUpdate, onReset, onExport, onImport }: SettingsDataProps) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleImport = async () => {
    if (!importFile) return;
    try {
      await onImport(importFile);
      setImportFile(null);
    } catch (error) {
      settingsLogger.error('Import failed:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      toast.error("Invalid File", {
        description: "Please select a valid JSON settings file.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Privacy Settings */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">PRIVACY</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/20 border border-purple-600/30">
            <div>
              <Label className="text-xs font-semibold text-white">Usage Analytics</Label>
              <p className="text-[11px] text-purple-300/80">Anonymous usage data to improve the app</p>
            </div>
            <Switch
              checked={settings.dataCollection}
              onCheckedChange={(checked) => onUpdate({ dataCollection: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/20 border border-purple-600/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <Label className="text-xs font-semibold text-white">Crash Reports</Label>
                <p className="text-[11px] text-purple-300/80">Send error logs</p>
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
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">BACKUP</span>
        </div>

        <div className="space-y-2">
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
              className="cursor-pointer h-11 text-xs file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-purple-500/20 file:text-purple-300 file:text-xs file:font-medium"
            />
          </div>

          {importFile && (
            <button
              onClick={handleImport}
              className="w-full retro-arcade-btn retro-arcade-btn-yellow px-3 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="retro-game-card p-4 border-red-500/30">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-4 h-4 text-red-400" />
          <span className="text-sm font-bold retro-pixel-text text-red-400">RESET</span>
        </div>

        <button
          className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-red-500/10 text-red-400 border-2 border-red-500/30 font-semibold text-sm"
          style={{ boxShadow: '0 2px 0 rgba(239,68,68,0.2)' }}
          onClick={() => setResetDialogOpen(true)}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Settings</span>
        </button>
      </div>

      {/* Reset Confirmation */}
      {resetDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setResetDialogOpen(false)} aria-hidden />
          <div className="relative retro-game-card border-2 border-purple-600/50 max-w-xs w-full p-6 space-y-4">
            <div className="space-y-2 text-center">
              <h2 className="text-base font-bold text-white">Reset Settings?</h2>
              <p className="text-xs text-purple-300/80">
                This will restore all default settings. Consider exporting first.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                className="retro-stat-pill px-3 py-2 text-xs font-semibold rounded-lg"
                onClick={() => setResetDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-3 py-2 text-xs font-bold rounded-lg"
                style={{ boxShadow: '0 2px 0 rgba(185,28,28,0.8)' }}
                onClick={() => { onReset(); setResetDialogOpen(false); }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
