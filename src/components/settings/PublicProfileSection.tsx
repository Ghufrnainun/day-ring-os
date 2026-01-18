'use client';

import * as React from 'react';
import { Share, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  togglePublicProfile,
  updateUsername,
  checkUsernameAvailable,
} from '@/actions/public-profile';
import { toast } from 'sonner';

interface PublicProfileSectionProps {
  initialPublicProfileEnabled: boolean;
  initialUsername: string;
}

export function PublicProfileSection({
  initialPublicProfileEnabled,
  initialUsername,
}: PublicProfileSectionProps) {
  const [publicProfileEnabled, setPublicProfileEnabled] = React.useState(
    initialPublicProfileEnabled,
  );
  const [username, setUsername] = React.useState(initialUsername);
  const [editingUsername, setEditingUsername] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState(username);
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [copied, setCopied] = React.useState(false);

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}`;

  const handleTogglePublicProfile = (checked: boolean) => {
    startTransition(async () => {
      try {
        await togglePublicProfile(checked);
        setPublicProfileEnabled(checked);
        toast.success(
          checked ? 'Profile is now public' : 'Profile is now private',
        );
      } catch (error: any) {
        toast.error(error?.message || "Couldn't save that change. Try again?");
      }
    });
  };

  const checkAvailability = React.useCallback(
    async (value: string) => {
      if (value === username) {
        setIsAvailable(null); // Same as current
        return;
      }

      if (!/^[a-z0-9-]{3,20}$/.test(value)) {
        setIsAvailable(false);
        return;
      }

      const available = await checkUsernameAvailable(value);
      setIsAvailable(available);
    },
    [username],
  );

  React.useEffect(() => {
    if (editingUsername && newUsername !== username) {
      const timer = setTimeout(() => checkAvailability(newUsername), 500);
      return () => clearTimeout(timer);
    }
  }, [newUsername, editingUsername, username, checkAvailability]);

  const handleSaveUsername = () => {
    if (!newUsername || newUsername === username) {
      setEditingUsername(false);
      return;
    }

    if (!isAvailable) {
      toast.info('That username is taken. Try a different one?');
      return;
    }

    startTransition(async () => {
      try {
        await updateUsername(newUsername);
        setUsername(newUsername);
        setEditingUsername(false);
        toast.success('Username updated');
      } catch (error: any) {
        toast.error(error?.message || "Couldn't update username. Try again?");
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6 rounded-xl bg-card border border-border/50">
      {/* Public Profile Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">Public Profile</h3>
          <p className="text-sm text-muted-foreground">
            Share your activity with others
          </p>
        </div>
        <Switch
          checked={publicProfileEnabled}
          onCheckedChange={handleTogglePublicProfile}
          disabled={isPending}
        />
      </div>

      {publicProfileEnabled && (
        <>
          {/* Username */}
          <div className="space-y-2">
            <Label>Username</Label>
            {editingUsername ? (
              <div className="space-y-2">
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="your-username"
                  disabled={isPending}
                />
                {newUsername !== username && (
                  <p className="text-xs">
                    {isAvailable === true && (
                      <span className="text-emerald-600">✓ Available</span>
                    )}
                    {isAvailable === false && (
                      <span className="text-destructive">
                        ✗ Not available or invalid format
                      </span>
                    )}
                    {isAvailable === null &&
                      newUsername !== username &&
                      'Checking...'}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    disabled={isPending || !isAvailable}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername(username);
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input value={username} disabled className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUsername(true)}
                >
                  Edit
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters, lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Profile Link */}
          <div className="space-y-2">
            <Label>Your Public Profile</Label>
            <div className="flex gap-2">
              <Input value={profileUrl} readOnly className="flex-1 text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link to show your activity heatmap
            </p>
          </div>
        </>
      )}
    </div>
  );
}
