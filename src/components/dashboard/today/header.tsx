'use client';

import { useTime } from '@/components/providers/time-provider';
import { useProfile } from '@/hooks/use-profile';
import { Skeleton } from '@/components/ui/skeleton';

export function TodayHeader() {
  const { logicalDate } = useTime();
  const { data: profile, isLoading } = useProfile();

  const hour = logicalDate.getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  if (hour >= 17) greeting = 'Good Evening';

  const dateDisplay = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(logicalDate);

  if (isLoading) {
    return (
      <div className="space-y-2 mb-8 animate-fade-in">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  return (
    <div className="space-y-1 mb-8 animate-fade-in">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {dateDisplay}
      </p>
      <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
        {greeting},{' '}
        <span className="text-primary">
          {profile?.display_name || 'Friend'}
        </span>
        .
      </h1>
      <p className="text-foreground/70 text-lg mt-2">
        Ready to conquer the day?
      </p>
    </div>
  );
}
