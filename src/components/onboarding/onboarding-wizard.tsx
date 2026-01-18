'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useProfile } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const STEPS = {
  PROFILE: 0,
  MODULES: 1,
};

const AVAILABLE_MODULES = [
  {
    id: 'planner',
    label: 'Daily Planner',
    description: 'The core of Orbit. Tasks and daily focus.',
    locked: true, // Always required
  },
  {
    id: 'habits',
    label: 'Habits',
    description: 'Track consistency gently without streaks.',
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Track income, expenses, and accounts.',
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Capture thoughts and ideas.',
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { data: user } = useUser();
  const { data: profile, refetch: refetchProfile } = useProfile();

  const [step, setStep] = useState(STEPS.PROFILE);
  const [loading, setLoading] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    planner: true,
    habits: true,
    finance: true,
    notes: true,
  });

  // Initialize form with existing profile data or defaults
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.email?.split('@')[0] || '');
      setTimezone(
        profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
      if (profile.active_modules) {
        // Merge with defaults to ensure all keys exist
        setActiveModules((prev) => ({ ...prev, ...profile.active_modules }));
      }
    } else if (user) {
      // Fallback if profile not loaded yet but user is
      setDisplayName(user.email?.split('@')[0] || '');
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile, user]);

  const handleNext = () => {
    if (step === STEPS.PROFILE) {
      if (!displayName.trim()) {
        toast.info('Please add your display name to continue.');
        return;
      }
      if (!timezone) {
        toast.info('Please select your timezone.');
        return;
      }
      setStep(STEPS.MODULES);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          timezone,
          active_modules: activeModules,
          setup_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Welcome to Orbit!');
      // Force a hard refresh to update server components/middleware checks
      window.location.href = '/today';
    } catch (error: any) {
      toast.error(error.message || "Something didn't work. Let's try again.");
      setLoading(false);
    }
  };

  // Simple timezone list for MVP
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
    // Add logic to detect and include user's local TZ if not in top list?
    // For now, let's stick to these or maybe a fuller list if requested.
    // Actually, let's add the current detected one to the top if unique.
  ];

  // Ensure the current detected timezone is in the list
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const uniqueTimezones = Array.from(
    new Set([detectedTz, ...timezones]),
  ).sort();

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-display">
            {step === STEPS.PROFILE
              ? 'Welcome to Orbit'
              : 'Customize Your Orbit'}
          </CardTitle>
          <CardDescription>
            {step === STEPS.PROFILE
              ? "Let's get to know you better."
              : 'Choose the tools you need today.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === STEPS.PROFILE && (
            <>
              <div className="space-y-2">
                <Label htmlFor="displayName">Also known as...</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-surface/50"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-surface/50">
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used to determine your &ldquo;Today&rdquo;.
                </p>
              </div>
            </>
          )}

          {step === STEPS.MODULES && (
            <div className="space-y-4">
              {AVAILABLE_MODULES.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-surface/30 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <Label
                      className="text-base font-medium cursor-pointer"
                      htmlFor={`switch-${module.id}`}
                    >
                      {module.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <Switch
                    id={`switch-${module.id}`}
                    checked={activeModules[module.id]}
                    disabled={module.locked}
                    onCheckedChange={(checked) =>
                      setActiveModules((prev) => ({
                        ...prev,
                        [module.id]: checked,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step === STEPS.PROFILE ? (
            <div /> // Spacer
          ) : (
            <Button variant="ghost" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}

          {step === STEPS.PROFILE ? (
            <Button onClick={handleNext} className="btn-primary">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
