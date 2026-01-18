'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureInstancesForRange } from '@/lib/logic/ensure-instances';
import {
  startOfMonth,
  endOfMonth,
  format,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';

export interface MonthlyStats {
  [date: string]: {
    total: number;
    done: number;
  };
}

export async function getMonthlyData(
  year: number,
  month: number, // 0-11
  timezone: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Calculate Range
  const date = new Date(year, month, 1);
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const startDateStr = format(start, 'yyyy-MM-dd');
  const endDateStr = format(end, 'yyyy-MM-dd');

  // 1. Ensure Instances for habits
  await ensureInstancesForRange(
    supabase,
    user.id,
    startDateStr,
    endDateStr,
    timezone,
  );

  // 2. Fetch both regular tasks AND habit instances
  const [tasksResult, instancesResult] = await Promise.all([
    // Regular tasks with scheduled_at
    supabase
      .from('tasks')
      .select('id, scheduled_at, status')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .gte('scheduled_at', startDateStr)
      .lte('scheduled_at', endDateStr + 'T23:59:59'),
    // Habit instances
    supabase
      .from('task_instances')
      .select('logical_day, status')
      .eq('user_id', user.id)
      .gte('logical_day', startDateStr)
      .lte('logical_day', endDateStr),
  ]);

  if (tasksResult.error) console.error('Tasks error:', tasksResult.error);
  if (instancesResult.error)
    console.error('Instances error:', instancesResult.error);

  // 3. Aggregate from both sources
  const stats: MonthlyStats = {};

  // Add regular tasks
  (tasksResult.data || []).forEach((task) => {
    if (!task.scheduled_at) return;
    const day = format(new Date(task.scheduled_at), 'yyyy-MM-dd');
    if (!stats[day]) stats[day] = { total: 0, done: 0 };

    stats[day].total++;
    if (task.status === 'completed' || task.status === 'done') {
      stats[day].done++;
    }
  });

  // Add habit instances
  (instancesResult.data || []).forEach((inst) => {
    const day = inst.logical_day;
    if (!stats[day]) stats[day] = { total: 0, done: 0 };

    stats[day].total++;
    if (inst.status === 'completed' || inst.status === 'done') {
      stats[day].done++;
    }
  });

  return { stats, currentMonth: format(date, 'yyyy-MM') };
}

// Helper for navigation
export async function getMonthNavigation(
  currentYear: number,
  currentMonth: number,
) {
  const current = new Date(currentYear, currentMonth, 1);
  const prev = subMonths(current, 1);
  const next = addMonths(current, 1);

  return {
    prev: { year: prev.getFullYear(), month: prev.getMonth() },
    next: { year: next.getFullYear(), month: next.getMonth() },
  };
}
