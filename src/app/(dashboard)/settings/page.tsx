'use client';

import {
  User,
  Bell,
  Shield,
  Moon,
  ChevronRight,
  LogOut,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: user } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      router.push('/login');
    }
  };

  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile Information',
          value: user?.email || 'Loading...',
        },
        { icon: Shield, label: 'Security', value: '' },
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
          onClick: () => router.push('/habits'),
        },
        { icon: Bell, label: 'Notifications', value: 'On' },
        { icon: Moon, label: 'Appearance', value: 'Light' },
      ],
    },
  ];

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-up">
      <header className="flex flex-col space-y-1 pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and preferences.
        </p>
      </header>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="bg-card/40 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-sm">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'w-full flex items-center justify-between p-4 hover:bg-white/40 transition-colors text-left group',
                    item.destructive &&
                      'text-destructive hover:bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-background border border-border/50',
                        item.destructive
                          ? 'text-destructive'
                          : 'text-muted-foreground group-hover:text-primary transition-colors'
                      )}
                    >
                      <item.icon size={18} />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-xs text-muted-foreground">
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

      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground/60">Orbit OS v1.0.0</p>
      </div>
    </div>
  );
}
