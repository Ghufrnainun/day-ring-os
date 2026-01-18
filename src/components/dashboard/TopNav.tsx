'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function TopNav() {
  // TODO: Fetch user profile from Supabase
  const user = {
    displayName: 'User',
    avatarUrl: null,
  };

  const today = useMemo(() => new Date(), []);
  const dateStr = format(today, 'EEEE, MMM d');
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, [today]);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between pb-6 pt-2 animate-fade-up">
      <div className="flex flex-col">
        <span className="font-serif italic text-primary text-lg tracking-wide">
          {dateStr}
        </span>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5 font-display">
          {greeting}, {user.displayName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Placeholder for settings or profile menu */}
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </Link>
        <Avatar className="w-10 h-10 border-2 border-background ring-1 ring-border">
          <AvatarImage src={user.avatarUrl || ''} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
