'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';

export default function MonthlyPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const supabase = createClient();

  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch task counts for the month
  const { data: taskCounts } = useQuery({
    queryKey: ['month-tasks', format(currentMonth, 'yyyy-MM')],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return {};
      // This is a bit complex in Supabase without a specific view,
      // but we can fetch all instances for the month range.
      // Optimization: create a view `monthly_task_counts` later?
      // For now, raw fetch instances.

      const { data, error } = await supabase
        .from('task_instances')
        .select('logical_day, status')
        .eq('user_id', user.id)
        .gte('logical_day', format(monthStart, 'yyyy-MM-dd'))
        .lte('logical_day', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Aggregate
      const counts: Record<string, { total: number; done: number }> = {};
      data.forEach((item) => {
        const day = item.logical_day;
        if (!counts[day]) counts[day] = { total: 0, done: 0 };
        counts[day].total++;
        if (item.status === 'done') counts[day].done++;
      });

      return counts;
    },
  });

  const goToDaily = (date: Date) => {
    router.push(`/calendar/daily?date=${format(date, 'yyyy-MM-dd')}`);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight size={20} />
          </Button>
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
        {/* Placeholder for empty days start of month */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const stats = taskCounts?.[dateKey];
          const hasTasks = stats && stats.total > 0;
          const isComplete = hasTasks && stats.done === stats.total;

          return (
            <button
              key={day.toISOString()}
              onClick={() => goToDaily(day)}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border border-transparent',
                isToday(day)
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-card/40 hover:bg-card/80 hover:scale-105 border-white/5',
                isSameDay(day, new Date()) &&
                  !isToday(day) &&
                  'border-primary/50' // Should handle selection later if needed
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isToday(day) ? 'font-bold' : ''
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Dots for tasks */}
              {hasTasks && (
                <div className="flex gap-0.5 mt-1">
                  {/* Just one dot if some exist, green if all done */}
                  <div
                    className={cn(
                      'w-1 h-1 rounded-full',
                      isComplete
                        ? isToday(day)
                          ? 'bg-white'
                          : 'bg-green-500'
                        : isToday(day)
                        ? 'bg-white/70'
                        : 'bg-muted-foreground'
                    )}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
