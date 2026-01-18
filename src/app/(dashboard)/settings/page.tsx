'use client';

import * as React from 'react';
import {
  User,
  Bell,
  Shield,
  Moon,
  ChevronRight,
  LogOut,
  Repeat,
  Globe,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/actions/profile';
import { ReminderManager } from '@/components/settings/ReminderManager';
import { PublicProfileSection } from '@/components/settings/PublicProfileSection';

// Profile Editor Component
function ProfileEditor({
  open,
  onOpenChange,
  initialName,
  initialTimezone,
}: any) {
  const [name, setName] = React.useState(initialName || '');
  const [timezone, setTimezone] = React.useState(
    initialTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [isPending, startTransition] = React.useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateProfile({ displayName: name, timezone });
        toast.success('Profile updated');
        onOpenChange(false);
      } catch {
        toast.error('Failed to update');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
            />
            <p className="text-xs text-muted-foreground">
              Used for day calculation.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = React.useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      router.push('/login');
    }
  };

  // Fetch profile via supabase directly or use hook?
  // Hook `useUser` returns Auth User. Profile data is in 'profiles' table.
  // We need to fetch it. For client component, useEffect or React Query.
  // Standard pattern: useProfile hook or just fetch once.
  // Let's implement a simple fetch here for MVP.
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user, supabase]);

  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile Information',
          value: profile?.display_name || user?.email || '...',
          onClick: () => setProfileOpen(true),
        },
        {
          icon: Globe,
          label: 'Timezone',
          value: profile?.timezone || '...',
          onClick: () => setProfileOpen(true),
        },
        {
          icon: LogOut,
          label: 'Sign Out',
          value: '',
          destructive: true,
          onClick: handleSignOut,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Repeat,
          label: 'Manage Habits',
          value: 'Active',
          onClick: () => router.push('/habits'), // Assuming habits page exists or leads to Today? Actually /habits might not exist. Redirect to Today and open sheet? Or Calendar.
          // Let's redirect to Calendar for now as that's where planning happens.
          // Or just today.
        },
        { icon: Bell, label: 'Notifications', value: 'On' }, // Placeholder
        { icon: Moon, label: 'Appearance', value: 'Light' }, // Placeholder
      ],
    },
  ];

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-in max-w-lg mx-auto w-full pt-8">
      <header className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and preferences.
        </p>
      </header>

      {/* Profile Dialog */}
      <ProfileEditor
        open={profileOpen}
        onOpenChange={setProfileOpen}
        initialName={profile?.display_name}
        initialTimezone={profile?.timezone}
      />

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-sm">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left group',
                    item.destructive &&
                      'text-destructive hover:bg-destructive/5',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-background/50 border border-white/5',
                        item.destructive
                          ? 'text-destructive'
                          : 'text-muted-foreground group-hover:text-primary transition-colors',
                      )}
                    >
                      <item.icon size={18} />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {item.value}
                      </span>
                    )}
                    {!item.destructive && (
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground/50"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reminders Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Reminders
        </h3>
        <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden p-4 shadow-sm">
          <ReminderManager />
        </div>
      </div>

      {/* Public Profile Section */}
      {profile && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Public Profile
          </h3>
          <PublicProfileSection
            initialPublicProfileEnabled={profile.public_profile_enabled ?? true}
            initialUsername={profile.username || ''}
          />
        </div>
      )}

      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground/40">
          Orbit OS v1.0.0 (Beta)
        </p>
      </div>
    </div>
  );
}
