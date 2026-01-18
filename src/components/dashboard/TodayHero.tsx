'use client';

import { DayRing } from '@/components/dashboard/DayRing';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { format } from 'date-fns';

export function TodayHero() {
  const { data: user } = useUser();
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: tasks } = useQuery({
    queryKey: ['tasks', today], // Same key as TaskList, so data is shared/cached
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('task_instances')
        .select(
          `
          id,
          status,
          tasks (
            title
          )
        `
        )
        .eq('user_id', user.id)
        .eq('logical_day', today);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60, // 1 minute stale time to prevent immediate refetch if TaskList just fetched
  });

  const total = tasks?.length || 0;
  const completed = tasks?.filter((t: any) => t.status === 'done').length || 0;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Focus is the first pending task, or the last completed one if all are done?
  // PRD says "Active Task".
  const activeTask = tasks?.find((t: any) => t.status === 'pending');
  // tasks is a related object - cast properly to access title
  const taskData = activeTask?.tasks as unknown as
    | { title: string }
    | undefined;
  const focusText =
    taskData?.title ||
    (total > 0 && total === completed ? 'All Done!' : 'Deep Work');

  return (
    <section className="flex flex-col items-center justify-center space-y-6 animate-fade-up-delay-1">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-serif italic text-muted-foreground">
          Focus: {focusText}
        </h2>
      </div>

      <DayRing progress={progress} size={260} />
    </section>
  );
}
