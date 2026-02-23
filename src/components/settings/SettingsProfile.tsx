import { useState, useEffect } from "react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Pencil, Check, X, Camera } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";

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
  const { isGuestMode, session } = useAuth();
  const { profile, updateProfile } = useSupabaseData();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  // Local-only guests (no session) can't save profiles — hide the section.
  // Anonymous Supabase users DO have a session and can edit their profile.
  const isLocalOnlyGuest = isGuestMode && !session;

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

  if (isLocalOnlyGuest) {
    return null;
  }

  return (
    <div className="retro-game-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-bold retro-pixel-text text-white">PROFILE</span>
      </div>

      <div className="space-y-4">
        {/* Avatar Selection */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <PixelIcon name={currentAvatar.icon} size={48} />
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-purple-300">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    selectedAvatar === avatar.id
                      ? 'retro-level-badge scale-110'
                      : 'retro-stat-pill'
                  )}
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
          <Label htmlFor="displayName" className="text-xs text-purple-300/80">
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-900/20 border border-purple-600/30">
              <span className="text-sm font-medium text-white">
                {profile?.display_name || 'Not set'}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-md retro-stat-pill transition-all active:scale-95"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 retro-arcade-btn px-3 py-2 text-xs flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 retro-arcade-btn retro-arcade-btn-green px-3 py-2 text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
