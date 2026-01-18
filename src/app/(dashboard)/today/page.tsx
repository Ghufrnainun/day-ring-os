import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTodayData } from '@/actions/today';
import { getStreakData } from '@/actions/streak';
import { getLogicalDate, formatLogicalDate } from '@/lib/date-utils';
import { TodayHeader } from '@/components/dashboard/today/header';
import { FocusCard } from '@/components/dashboard/today/focus-card';
import { Timeline } from '@/components/dashboard/today/timeline';
import { StreakWidget } from '@/components/dashboard/StreakWidget';
import { AddHabitSheet } from '@/components/dashboard/tasks/AddHabitSheet';
import { QuickFinance } from '@/components/dashboard/today/quick-finance';
import { Sparkles } from 'lucide-react';

export default async function TodayPage() {
  const supabase = await createClient(); // Ensure awaited
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
  const logicalDate = getLogicalDate(timezone);
  const dateString = formatLogicalDate(logicalDate);

  const [data, streakData] = await Promise.all([
    getTodayData(dateString, timezone),
    getStreakData(),
  ]);

  // Focus Logic: Highest priority task that isn't done
  const focusTask = data.tasks.find((t) => t.status !== 'completed');

  // Timeline Logic: Merge and sort
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
      id: h.id, // rule.id
      type: 'habit' as const,
      title: h.rule_config?.title || 'Habit',
      completed: h.completed,
      time: null, // Habits usually don't have time in MVP
      original: h,
    })),
  ];

  timelineItems.sort((a, b) => {
    // Tasks with time first
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    // Then by title/id stability
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 sm:pb-8 relative animate-page-enter">
      <div className="flex items-start justify-between">
        <TodayHeader />
        <div className="flex items-center gap-3">
          <AddHabitSheet>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-sm">
              <Sparkles className="w-5 h-5" />
            </button>
          </AddHabitSheet>
        </div>
      </div>

      {/* Streak Widget */}
      <div className="mt-6 animate-fade-up">
        <StreakWidget data={streakData} />
      </div>

      <div className="space-y-8 mt-6 animate-fade-up-delay-1">
        {focusTask ? (
          <FocusCard task={focusTask} />
        ) : (
          <div className="p-8 rounded-2xl bg-card/40 border border-border/60 border-dashed text-center">
            <p className="font-display text-lg text-muted-foreground/80">
              You&apos;re all caught up for now.
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Take a breath.
            </p>
          </div>
        )}

        <Timeline items={timelineItems} dateString={dateString} />

        {/* Quick Finance Log */}
        <div className="pt-4">
          <QuickFinance dateString={dateString} />
        </div>
      </div>
    </div>
  );
}
