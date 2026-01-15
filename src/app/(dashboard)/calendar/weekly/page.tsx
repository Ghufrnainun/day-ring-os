'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { TaskItem } from '@/components/dashboard/TaskItem';

export default function WeeklyPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const supabase = createClient();

  const [currentWeek, setCurrentWeek] = React.useState(new Date());

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weekTasks } = useQuery({
    queryKey: ['week-tasks', format(weekStart, 'yyyy-MM-dd')],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('task_instances')
        .select(
          `
          id, status, logical_day,
          tasks (title, scheduled_at)
        `
        )
        .eq('user_id', user.id)
        .gte('logical_day', format(weekStart, 'yyyy-MM-dd'))
        .lte('logical_day', format(weekEnd, 'yyyy-MM-dd'))
        .order('logical_day', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Group by day
  const tasksByDay = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    weekTasks?.forEach((t) => {
      const day = t.logical_day;
      if (!groups[day]) groups[day] = [];
      groups[day].push(t);
    });
    return groups;
  }, [weekTasks]);

  const handleTaskClick = (day: Date) => {
    router.push(`/calendar/daily?date=${format(day, 'yyyy-MM-dd')}`);
  };

  return (
    <div className="flex flex-col space-y-4 animate-fade-in h-full pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display tracking-tight">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </header>

      {/* Horizontal Scroll / Grid for Mobile/Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay[dateKey] || [];

          return (
            <div
              key={dateKey}
              className={cn(
                'flex flex-col space-y-2 min-h-[150px] p-2 rounded-xl border border-white/5 transition-colors',
                isToday(day) ? 'bg-primary/5 border-primary/20' : 'bg-card/20'
              )}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-xs uppercase font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    isToday(day) && 'text-primary'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div
                className="space-y-1.5 flex-1"
                onClick={() => handleTaskClick(day)}
              >
                {dayTasks.slice(0, 5).map((t: any) => (
                  <div
                    key={t.id}
                    className="text-[10px] p-1.5 rounded bg-background/50 border border-white/5 truncate"
                  >
                    <span
                      className={cn(
                        'mr-1 inline-block w-1.5 h-1.5 rounded-full',
                        t.status === 'done'
                          ? 'bg-green-500'
                          : 'bg-muted-foreground'
                      )}
                    />
                    {t.tasks?.title}
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/30">
                      -
                    </span>
                  </div>
                )}
                {dayTasks.length > 5 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayTasks.length - 5}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
