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
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';

export default function WeeklyPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const supabase = createClient();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [currentWeek, setCurrentWeek] = React.useState(new Date());
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Swipe detection threshold (min distance in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left = next week
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
    if (isRightSwipe) {
      // Swipe right = previous week
      setCurrentWeek(subWeeks(currentWeek, 1));
    }
  };

  // Fetch regular tasks (one-off tasks with scheduled_at)
  const { data: weekTasks } = useQuery({
    queryKey: ['week-tasks', format(weekStart, 'yyyy-MM-dd')],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // Fetch regular tasks scheduled in this week
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, scheduled_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('scheduled_at', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_at', format(weekEnd, 'yyyy-MM-dd') + 'T23:59:59')
        .order('scheduled_at', { ascending: true });

      if (tasksError) {
        console.error('Weekly tasks error:', tasksError);
        return [];
      }

      // Fetch habit instances for this week
      const { data: instances, error: instancesError } = await supabase
        .from('task_instances')
        .select(
          `
          id, status, logical_day,
          tasks (title)
        `,
        )
        .eq('user_id', user.id)
        .gte('logical_day', format(weekStart, 'yyyy-MM-dd'))
        .lte('logical_day', format(weekEnd, 'yyyy-MM-dd'))
        .order('logical_day', { ascending: true });

      if (instancesError) {
        console.error('Weekly instances error:', instancesError);
        return [];
      }

      // Combine and normalize
      const normalizedTasks = (tasks || []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        logical_day: t.scheduled_at
          ? format(new Date(t.scheduled_at), 'yyyy-MM-dd')
          : null,
        type: 'task' as const,
      }));

      const normalizedInstances = (instances || []).map((i) => ({
        id: i.id,
        title: (i.tasks as any)?.title || 'Habit',
        status: i.status,
        logical_day: i.logical_day,
        type: 'habit' as const,
      }));

      return [...normalizedTasks, ...normalizedInstances];
    },
  });

  // Group by day
  const tasksByDay = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    weekTasks?.forEach((t) => {
      const day = t.logical_day;
      if (!day) return;
      if (!groups[day]) groups[day] = [];
      groups[day].push(t);
    });
    return groups;
  }, [weekTasks]);

  const handleDayClick = (day: Date) => {
    router.push(`/calendar/daily?date=${format(day, 'yyyy-MM-dd')}`);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const isCurrentWeek = isSameDay(startOfWeek(new Date()), weekStart);

  return (
    <div className="flex flex-col space-y-4 animate-fade-in h-full pb-20">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-display tracking-tight">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h1>
          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs text-primary"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Today
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="rounded-full"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </header>

      {/* Week Slider Container */}
      <div
        ref={scrollContainerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative"
      >
        {/* Mobile: Horizontal Scroll with Snap */}
        <div className="flex md:hidden gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
          {days.map((day) => (
            <DayCard
              key={format(day, 'yyyy-MM-dd')}
              day={day}
              tasks={tasksByDay[format(day, 'yyyy-MM-dd')] || []}
              onClick={() => handleDayClick(day)}
              isMobile
            />
          ))}
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-7 gap-3">
          {days.map((day) => (
            <DayCard
              key={format(day, 'yyyy-MM-dd')}
              day={day}
              tasks={tasksByDay[format(day, 'yyyy-MM-dd')] || []}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      </div>

      {/* Swipe Hint for Mobile */}
      <p className="md:hidden text-center text-xs text-muted-foreground/50">
        Swipe left or right to change weeks
      </p>
    </div>
  );
}

interface DayCardProps {
  day: Date;
  tasks: any[];
  onClick: () => void;
  isMobile?: boolean;
}

function DayCard({ day, tasks, onClick, isMobile }: DayCardProps) {
  const dateKey = format(day, 'yyyy-MM-dd');
  const isCurrentDay = isToday(day);
  const completedCount = tasks.filter(
    (t) => t.status === 'done' || t.status === 'completed',
  ).length;
  const totalCount = tasks.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col space-y-2 p-3 rounded-xl border transition-all cursor-pointer',
        'hover:shadow-md hover:border-primary/30',
        isCurrentDay
          ? 'bg-primary/5 border-primary/30 shadow-sm'
          : 'bg-card/40 border-border/50',
        isMobile && 'min-w-[140px] snap-center flex-shrink-0',
      )}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between border-b border-border/30 pb-2">
        <span
          className={cn(
            'text-xs uppercase font-medium',
            isCurrentDay ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {format(day, 'EEE')}
        </span>
        <span
          className={cn(
            'text-lg font-bold',
            isCurrentDay ? 'text-primary' : 'text-foreground',
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      {/* Task Preview */}
      <div className="space-y-1.5 min-h-[80px] flex-1">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40">—</span>
          </div>
        ) : (
          <>
            {tasks.slice(0, 3).map((t: any) => (
              <div
                key={t.id}
                className="text-[11px] p-1.5 rounded bg-background/60 border border-border/30 truncate flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full flex-shrink-0',
                    t.status === 'done' || t.status === 'completed'
                      ? 'bg-green-500'
                      : t.status === 'skipped'
                        ? 'bg-yellow-500'
                        : 'bg-muted-foreground/50',
                  )}
                />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {tasks.length > 3 && (
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                +{tasks.length - 3} more
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress Indicator */}
      {totalCount > 0 && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                'font-medium',
                completedCount === totalCount
                  ? 'text-green-600'
                  : 'text-foreground',
              )}
            >
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="mt-1 h-1 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                completedCount === totalCount ? 'bg-green-500' : 'bg-primary',
              )}
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
