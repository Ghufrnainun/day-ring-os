import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyData, getMonthNavigation } from '@/actions/calendar';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DensityDots } from '@/components/ui/density-indicator';

interface MonthlyPageProps {
  searchParams: Promise<{
    date?: string; // YYYY-MM
  }>;
}

export default async function MonthlyPage(props: MonthlyPageProps) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Parse Date
  const now = new Date();
  const dateParam = searchParams?.date;
  let currentMonthDate = now;

  if (dateParam) {
    // Basic validation/parsing
    try {
      currentMonthDate = parseISO(`${dateParam}-01`);
      if (isNaN(currentMonthDate.getTime())) throw new Error();
    } catch {
      currentMonthDate = now;
    }
  }

  // Fetch Profile for Timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .single();
  const timezone = profile?.timezone || 'UTC';

  // Fetch Data
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const { stats } = await getMonthlyData(year, month, timezone);
  const nav = await getMonthNavigation(year, month);

  // Grid Prep
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevLink = `/calendar/monthly?date=${nav.prev.year}-${String(
    nav.prev.month + 1
  ).padStart(2, '0')}`;
  const nextLink = `/calendar/monthly?date=${nav.next.year}-${String(
    nav.next.month + 1
  ).padStart(2, '0')}`;

  const monthLabel = format(currentMonthDate, 'MMMM yyyy');

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-20 max-w-2xl mx-auto w-full">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          {monthLabel}
        </h1>
        <div className="flex items-center gap-1">
          <Link href={prevLink}>
            <Button variant="ghost" size="icon">
              <ChevronLeft size={20} />
            </Button>
          </Link>
          <Link href={nextLink}>
            <Button variant="ghost" size="icon">
              <ChevronRight size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for start of month offset */}
        {Array.from({ length: getDay(monthStart) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayStats = stats[dateKey];
          const hasTasks = dayStats && dayStats.total > 0;
          const isComplete = hasTasks && dayStats.done === dayStats.total;
          const isCurrentDay = isSameDay(day, now);

          return (
            <Link
              key={dateKey}
              href={`/calendar/daily?date=${dateKey}`}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border outline-none focus-visible:ring-2 ring-primary/50',
                isCurrentDay
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-transparent'
                  : 'bg-card/40 hover:bg-card/80 border-white/5 hover:scale-105 hover:border-white/10'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isCurrentDay ? 'font-bold' : ''
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Density dots for tasks */}
              {hasTasks && (
                <div className="mt-1">
                  <DensityDots
                    count={dayStats.total}
                    color={
                      isComplete
                        ? 'success'
                        : isCurrentDay
                        ? 'default'
                        : 'muted'
                    }
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Click a day to view its plan.
        </p>
      </div>
    </div>
  );
}
