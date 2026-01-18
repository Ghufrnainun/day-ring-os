'use server';

import { createClient } from '@/lib/supabase/server';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

// ============================================
// Weekly Review Data
// ============================================

export interface WeeklyReviewData {
  weekStart: string;
  weekEnd: string;
  // Task Stats
  tasksCompleted: number;
  tasksTotal: number;
  taskCompletionRate: number;
  // Habit Stats
  habitsCompleted: number;
  habitsTotal: number;
  habitCompletionRate: number;
  currentStreak: number;
  // Finance Stats
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  topCategories: Array<{ category: string; amount: number }>;
  // Activity
  activeDays: number;
  dailyBreakdown: Array<{
    date: string;
    tasksCompleted: number;
    habitsCompleted: number;
    transactions: number;
  }>;
}

export async function getWeeklyReviewData(
  weekOffset = 0,
  timezone = 'UTC'
): Promise<WeeklyReviewData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Calculate week range
  const referenceDate = subWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');

  // Fetch task instances
  const { data: taskInstances } = await supabase
    .from('task_instances')
    .select('status, logical_day, task_id, tasks(is_repeating)')
    .eq('user_id', user.id)
    .gte('logical_day', startStr)
    .lte('logical_day', endStr);

  // Separate tasks vs habits
  const tasks = (taskInstances || []).filter(
    (ti: any) => !ti.tasks?.is_repeating
  );
  const habits = (taskInstances || []).filter(
    (ti: any) => ti.tasks?.is_repeating
  );

  const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;
  const habitsCompleted = habits.filter(
    (h) => h.status === 'done' || h.status === 'completed'
  ).length;

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, category, logical_day')
    .eq('user_id', user.id)
    .gte('logical_day', startStr)
    .lte('logical_day', endStr);

  const totalIncome = (transactions || [])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = (transactions || [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Top expense categories
  const categoryTotals: Record<string, number> = {};
  (transactions || [])
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Get current streak from gamification_stats
  const { data: gamStats } = await supabase
    .from('gamification_stats')
    .select('streak_days')
    .eq('user_id', user.id)
    .single();

  // Daily breakdown
  const dailyBreakdown = weekDays.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(
      (t) => t.logical_day === dayStr && t.status === 'completed'
    );
    const dayHabits = habits.filter(
      (h) =>
        h.logical_day === dayStr &&
        (h.status === 'done' || h.status === 'completed')
    );
    const dayTransactions = (transactions || []).filter(
      (t) => t.logical_day === dayStr
    );

    return {
      date: dayStr,
      tasksCompleted: dayTasks.length,
      habitsCompleted: dayHabits.length,
      transactions: dayTransactions.length,
    };
  });

  // Active days (any completion)
  const activeDays = dailyBreakdown.filter(
    (d) => d.tasksCompleted > 0 || d.habitsCompleted > 0 || d.transactions > 0
  ).length;

  return {
    weekStart: startStr,
    weekEnd: endStr,
    tasksCompleted,
    tasksTotal: tasks.length,
    taskCompletionRate:
      tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0,
    habitsCompleted,
    habitsTotal: habits.length,
    habitCompletionRate:
      habits.length > 0
        ? Math.round((habitsCompleted / habits.length) * 100)
        : 0,
    currentStreak: gamStats?.streak_days || 0,
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    topCategories,
    activeDays,
    dailyBreakdown,
  };
}

// ============================================
// Monthly Review Data
// ============================================

export interface MonthlyReviewData {
  monthStart: string;
  monthEnd: string;
  monthLabel: string;
  // Aggregates
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  // Weekly breakdown
  weeklyBreakdown: Array<{
    weekLabel: string;
    tasksCompleted: number;
    habitsCompleted: number;
    netFlow: number;
  }>;
  // Top categories
  topCategories: Array<{ category: string; amount: number }>;
  // Heatmap data (day -> execution count)
  heatmapData: Array<{ date: string; count: number }>;
}

export async function getMonthlyReviewData(
  monthOffset = 0,
  timezone = 'UTC'
): Promise<MonthlyReviewData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Calculate month range
  const referenceDate = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startStr = format(monthStart, 'yyyy-MM-dd');
  const endStr = format(monthEnd, 'yyyy-MM-dd');
  const monthLabel = format(monthStart, 'MMMM yyyy');

  // Fetch task instances
  const { data: taskInstances } = await supabase
    .from('task_instances')
    .select('status, logical_day, task_id, tasks(is_repeating)')
    .eq('user_id', user.id)
    .gte('logical_day', startStr)
    .lte('logical_day', endStr);

  const tasks = (taskInstances || []).filter(
    (ti: any) => !ti.tasks?.is_repeating
  );
  const habits = (taskInstances || []).filter(
    (ti: any) => ti.tasks?.is_repeating
  );

  const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;
  const habitsCompleted = habits.filter(
    (h) => h.status === 'done' || h.status === 'completed'
  ).length;

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, category, logical_day')
    .eq('user_id', user.id)
    .gte('logical_day', startStr)
    .lte('logical_day', endStr);

  const totalIncome = (transactions || [])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = (transactions || [])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Top expense categories
  const categoryTotals: Record<string, number> = {};
  (transactions || [])
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Heatmap data
  const heatmapData = monthDays.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(
      (t) => t.logical_day === dayStr && t.status === 'completed'
    ).length;
    const dayHabits = habits.filter(
      (h) =>
        h.logical_day === dayStr &&
        (h.status === 'done' || h.status === 'completed')
    ).length;
    const dayTransactions = (transactions || []).filter(
      (t) => t.logical_day === dayStr
    ).length;

    return {
      date: dayStr,
      count: dayTasks + dayHabits + dayTransactions,
    };
  });

  // Simplified weekly breakdown (4-5 weeks per month)
  const weeklyBreakdown: MonthlyReviewData['weeklyBreakdown'] = [];
  let currentWeek = 1;
  let weekTasks = 0;
  let weekHabits = 0;
  let weekNet = 0;

  monthDays.forEach((day, index) => {
    const dayStr = format(day, 'yyyy-MM-dd');

    // Add to current week totals
    weekTasks += tasks.filter(
      (t) => t.logical_day === dayStr && t.status === 'completed'
    ).length;
    weekHabits += habits.filter(
      (h) =>
        h.logical_day === dayStr &&
        (h.status === 'done' || h.status === 'completed')
    ).length;

    const dayIncome = (transactions || [])
      .filter((t) => t.logical_day === dayStr && t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const dayExpense = (transactions || [])
      .filter((t) => t.logical_day === dayStr && t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    weekNet += dayIncome - dayExpense;

    // End of week (Sunday) or end of month
    if (day.getDay() === 0 || index === monthDays.length - 1) {
      weeklyBreakdown.push({
        weekLabel: `Week ${currentWeek}`,
        tasksCompleted: weekTasks,
        habitsCompleted: weekHabits,
        netFlow: weekNet,
      });
      currentWeek++;
      weekTasks = 0;
      weekHabits = 0;
      weekNet = 0;
    }
  });

  return {
    monthStart: startStr,
    monthEnd: endStr,
    monthLabel,
    tasksCompleted,
    tasksTotal: tasks.length,
    habitsCompleted,
    habitsTotal: habits.length,
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    topCategories,
    weeklyBreakdown,
    heatmapData,
  };
}
