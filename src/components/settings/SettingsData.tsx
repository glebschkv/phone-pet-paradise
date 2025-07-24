import { useState } from "react";
import { AppSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database, Download, Upload, RotateCcw, Shield, AlertTriangle } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data & Privacy
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your data, privacy settings, and backups
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control what data is collected and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="data-collection" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Anonymous Usage Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Help improve the app by sharing anonymous usage statistics
              </p>
            </div>
            <Switch
              id="data-collection"
              checked={settings.dataCollection}
              onCheckedChange={(checked) => onUpdate({ dataCollection: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="crash-reporting" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Crash Reporting
              </Label>
              <p className="text-sm text-muted-foreground">
                Send crash reports to help fix bugs and improve stability
              </p>
            </div>
            <Switch
              id="crash-reporting"
              checked={settings.crashReporting}
              onCheckedChange={(checked) => onUpdate({ crashReporting: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Export your settings or import from a backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={onExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Settings
            </Button>

            <div className="space-y-2">
              <Input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {importFile && (
                <Button
                  onClick={handleImport}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import "{importFile.name}"
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your settings to their default values. 
                  This action cannot be undone. Consider exporting your current 
                  settings first as a backup.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};