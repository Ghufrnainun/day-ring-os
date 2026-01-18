import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTodayData } from '@/actions/today';
import { format, parseISO } from 'date-fns';
import { Timeline } from '@/components/dashboard/today/timeline';
import { FocusCard } from '@/components/dashboard/today/focus-card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AddTaskSheet } from '@/components/dashboard/tasks/add-task-sheet';
import { AddHabitSheet } from '@/components/dashboard/tasks/AddHabitSheet';
import { Sparkles } from 'lucide-react';

interface DailyPageProps {
  searchParams: Promise<{
    date?: string; // YYYY-MM-DD
  }>;
}

export default async function DailyPage(props: DailyPageProps) {
  const searchParams = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .single();
  const timezone = profile?.timezone || 'UTC';

  // Parse Date
  const dateStr = searchParams.date || new Date().toISOString().split('T')[0];
  const dateObj = parseISO(dateStr);

  // Reuse the logic from Today actions
  const data = await getTodayData(dateStr, timezone);

  // Focus Logic
  const focusTask = data.tasks.find((t) => t.status !== 'completed');

  // Timeline Logic
  const timelineItems = [
    ...data.tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: t.title,
      status: t.status,
      time: t.due_time,
      original: t,
    })),
    ...data.habits.map((h) => ({
      id: h.id,
      type: 'habit' as const,
      title: h.rule_config?.title || 'Habit',
      completed: h.completed,
      time: null,
      original: h,
    })),
  ];

  timelineItems.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return a.title.localeCompare(b.title);
  });

  const displayDate = format(dateObj, 'EEEE, MMMM do');
  const monthLink = `/calendar/monthly?date=${format(dateObj, 'yyyy-MM')}`;

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 sm:pb-8 relative animate-fade-in">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-8">
        <Link
          href={monthLink}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors w-fit"
        >
          <ChevronLeft size={16} /> Back to Month
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-medium">{displayDate}</h1>
          {/* Add buttons removed - using GlobalAddSheet FAB from bottom nav */}
        </div>
      </div>

      <div className="space-y-8">
        {focusTask ? (
          <FocusCard task={focusTask} />
        ) : (
          <div className="p-8 rounded-2xl bg-card/40 border border-border/60 border-dashed text-center">
            <p className="font-display text-lg text-muted-foreground/80">
              No specific plan for this day.
            </p>
          </div>
        )}

        <Timeline items={timelineItems} dateString={dateStr} />
      </div>
    </div>
  );
}
