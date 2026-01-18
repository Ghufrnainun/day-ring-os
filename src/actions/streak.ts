'use server';

import { createClient } from '@/lib/supabase/server';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayComplete: boolean;
  weekProgress: {
    date: string;
    completed: boolean;
    total: number;
    done: number;
  }[];
}

/**
 * Calculate user's streak based on daily task/habit completion
 * A day is "complete" if user finished at least 50% of their scheduled items
 */
export async function getStreakData(): Promise<StreakData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayComplete: false,
      weekProgress: [],
    };
  }

  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 6);

  // Fetch tasks scheduled in the last 30 days (for streak calculation)
  const thirtyDaysAgo = subDays(today, 30);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, scheduled_at, status')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('scheduled_at', format(thirtyDaysAgo, 'yyyy-MM-dd'))
    .lte('scheduled_at', format(today, 'yyyy-MM-dd') + 'T23:59:59');

  const { data: instances } = await supabase
    .from('task_instances')
    .select('id, logical_day, status')
    .eq('user_id', user.id)
    .gte('logical_day', format(thirtyDaysAgo, 'yyyy-MM-dd'))
    .lte('logical_day', format(today, 'yyyy-MM-dd'));

  // Group by day
  const dayMap = new Map<string, { total: number; done: number }>();

  // Process regular tasks
  (tasks || []).forEach((t) => {
    if (!t.scheduled_at) return;
    const day = format(new Date(t.scheduled_at), 'yyyy-MM-dd');
    const entry = dayMap.get(day) || { total: 0, done: 0 };
    entry.total++;
    if (t.status === 'done' || t.status === 'completed') entry.done++;
    dayMap.set(day, entry);
  });

  // Process habit instances
  (instances || []).forEach((i) => {
    if (!i.logical_day) return;
    const day = i.logical_day;
    const entry = dayMap.get(day) || { total: 0, done: 0 };
    entry.total++;
    if (i.status === 'done' || i.status === 'completed') entry.done++;
    dayMap.set(day, entry);
  });

  // Calculate streak going backwards from today
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < 30; i++) {
    const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
    const dayData = dayMap.get(checkDate);

    // Day is complete if >= 50% done (or no items scheduled = skip)
    const isComplete = dayData ? dayData.done >= dayData.total * 0.5 : false;

    if (isComplete) {
      tempStreak++;
      if (i === 0 || currentStreak > 0) {
        currentStreak = tempStreak;
      }
    } else if (dayData && dayData.total > 0) {
      // Had tasks but didn't complete - breaks current streak
      if (i === 0) currentStreak = 0; // Today not complete
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
    // If no tasks scheduled, we skip that day (doesn't break streak)
  }

  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // Build week progress
  const weekProgress: StreakData['weekProgress'] = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayData = dayMap.get(date) || { total: 0, done: 0 };
    weekProgress.push({
      date,
      completed: dayData.total > 0 && dayData.done >= dayData.total * 0.5,
      total: dayData.total,
      done: dayData.done,
    });
  }

  const todayData = dayMap.get(format(today, 'yyyy-MM-dd'));
  const todayComplete = todayData
    ? todayData.done >= todayData.total * 0.5
    : false;

  return {
    currentStreak,
    longestStreak,
    todayComplete,
    weekProgress,
  };
}
