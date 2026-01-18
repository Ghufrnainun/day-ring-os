'use client';

import * as React from 'react';
import {
  User,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Globe,
  Loader2,
  Flame,
  Star,
  Award,
  Settings,
  ExternalLink,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/actions/profile';
import { ReminderManager } from '@/components/settings/ReminderManager';
import { PublicProfileSection } from '@/components/settings/PublicProfileSection';
import { useQuery } from '@tanstack/react-query';

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
  const [isPending, setIsPending] = React.useState(false);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await updateProfile({ displayName: name, timezone });
      toast.success('Profile updated!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Jakarta"
              className="rounded-xl"
            />
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
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

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  // Fetch gamification stats
  const { data: stats } = useQuery({
    queryKey: ['gamification_stats'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('gamification_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return (
        data || { points: 0, level: 1, current_streak: 0, longest_streak: 0 }
      );
    },
  });

  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      subtitle:
        profile?.display_name || user?.email?.split('@')[0] || 'Set your name',
      onClick: () => setProfileOpen(true),
    },
    {
      icon: Globe,
      label: 'Timezone',
      subtitle: profile?.timezone || 'UTC',
      onClick: () => setProfileOpen(true),
    },
    {
      icon: Bell,
      label: 'Notifications',
      subtitle: 'Email reminders',
      onClick: () => {},
    },
    {
      icon: Shield,
      label: 'Privacy',
      subtitle: 'Public profile settings',
      onClick: () => {},
    },
  ];

  if (isLoading)
    return (
      <div className="max-w-lg mx-auto pt-6 pb-24 space-y-6 animate-page-enter">
        {/* Profile Hero Skeleton */}
        <div className="p-6 rounded-3xl bg-white/60 border border-white/50 space-y-4">
          <div className="flex items-start gap-5">
            {/* Avatar skeleton */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted/60 overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted/60" />
            </div>
            {/* Name & email skeleton */}
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 w-40 rounded-lg bg-muted/60 overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
              <div className="h-4 w-32 rounded bg-muted/60 overflow-hidden relative">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
              {/* Stats skeleton */}
              <div className="flex gap-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted/60" />
                    <div className="space-y-1">
                      <div className="h-4 w-8 rounded bg-muted/60" />
                      <div className="h-2 w-10 rounded bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted/60 ml-1" />
          <div className="rounded-2xl border border-border/30 bg-card/60 divide-y divide-border/20">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 overflow-hidden relative">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted/60" />
                  <div className="h-3 w-32 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  const displayName =
    profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col space-y-6 pb-24 max-w-lg mx-auto animate-page-enter">
      {/* Profile Hero Card - Premium Glassmorphism */}
      <div className="relative pt-6">
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/80 via-stone-50/60 to-amber-50/30 border border-white/50 shadow-xl shadow-stone-200/30 backdrop-blur-sm overflow-hidden group">
          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
          <div className="absolute -left-8 bottom-0 w-32 h-32 rounded-full bg-gradient-to-tr from-amber-200/20 to-orange-200/10 blur-2xl" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <div className="relative flex items-start gap-5">
            {/* Premium Avatar with Animated Gradient Ring */}
            <div className="relative">
              {/* Animated gradient ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-full opacity-75 blur-sm animate-pulse" />
              <div
                className="absolute -inset-1 bg-gradient-to-r from-primary via-emerald-500 to-secondary rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(43 72% 50%), hsl(var(--primary)))',
                }}
              />

              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-2xl font-bold font-display shadow-lg ring-4 ring-white">
                {initials}
              </div>

              {/* Level badge with glow */}
              <div className="absolute -bottom-1 -right-1">
                <div className="absolute inset-0 bg-secondary rounded-full blur-sm opacity-50" />
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-orange-500 text-white text-xs font-bold flex items-center justify-center border-3 border-white shadow-lg">
                  {stats?.level || 1}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-1">
              <h1 className="text-xl font-bold font-display tracking-tight">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>

              {/* Premium Stats row */}
              <div className="flex gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm">
                    <Star size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {stats?.points || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Points
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm">
                    <Flame size={14} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {stats?.current_streak || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Streak
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm">
                    <Award size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {stats?.longest_streak || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Best
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dialog */}
      <ProfileEditor
        open={profileOpen}
        onOpenChange={setProfileOpen}
        initialName={profile?.display_name}
        initialTimezone={profile?.timezone}
      />

      {/* Menu Items */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Account
        </h3>
        <div className="bg-card/60 border border-border/30 rounded-2xl overflow-hidden divide-y divide-border/20">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                  <item.icon size={18} />
                </div>
                <div>
                  <span className="font-medium text-sm block">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/30" />
            </button>
          ))}
        </div>
      </div>

      {/* Reminders Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Reminders
        </h3>
        <div className="bg-card/60 border border-border/30 rounded-2xl overflow-hidden p-4">
          <ReminderManager />
        </div>
      </div>

      {/* Public Profile Section */}
      {profile && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Public Profile
          </h3>
          <PublicProfileSection
            initialPublicProfileEnabled={profile.public_profile_enabled ?? true}
            initialUsername={profile.username || ''}
          />
        </div>
      )}

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors text-sm font-medium"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      <div className="text-center pt-4 pb-4">
        <p className="text-xs text-muted-foreground/40">
          Orbit OS v1.0.0 (Beta)
        </p>
      </div>
    </div>
  );
}
