import { useState, useEffect } from "react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, Pencil, Check, X, Camera } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";

const AVATAR_OPTIONS = [
  { id: 'default', icon: 'panda', label: 'Panda' },
  { id: 'cat', icon: 'cat', label: 'Cat' },
  { id: 'dog', icon: 'dog', label: 'Dog' },
  { id: 'fox', icon: 'fox', label: 'Fox' },
  { id: 'bear', icon: 'bear', label: 'Bear' },
  { id: 'rabbit', icon: 'rabbit', label: 'Rabbit' },
  { id: 'koala', icon: 'koala', label: 'Koala' },
  { id: 'lion', icon: 'lion', label: 'Lion' },
];

export const SettingsProfile = () => {
  const { isGuestMode } = useAuth();
  const { profile, updateProfile } = useSupabaseData();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setSelectedAvatar(profile.avatar_url || 'default');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: selectedAvatar
      });
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (_error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || '');
    setSelectedAvatar(profile?.avatar_url || 'default');
    setIsEditing(false);
  };

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  if (isGuestMode) {
    return null; // Don't show profile editing for guests
  }

  return (
    <div className="retro-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-primary" />
        <Label className="text-sm font-bold">Profile</Label>
      </div>

      <div className="space-y-4">
        {/* Avatar Selection */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
              <PixelIcon name={currentAvatar.icon} size={48} />
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    selectedAvatar === avatar.id
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  title={avatar.label}
                >
                  <PixelIcon name={avatar.icon} size={24} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-xs text-muted-foreground">
            Display Name
          </Label>
          {isEditing ? (
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="h-10 rounded-lg"
              maxLength={30}
            />
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
              <span className="text-sm font-medium">
                {profile?.display_name || 'Not set'}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
