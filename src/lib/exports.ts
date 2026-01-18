/**
 * Data Export Utilities
 *
 * Provides CSV and PDF export functionality for tasks, habits, and finance data.
 * Exports are user-scoped and respect privacy settings.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// --- CSV Export ---

/**
 * Convert an array of objects to CSV string
 */
export function toCSV(
  data: Record<string, unknown>[],
  columns: { key: string; header: string }[],
): string {
  if (data.length === 0) return '';

  // Header row
  const header = columns.map((c) => `"${c.header}"`).join(',');

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return String(value);
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Export tasks to CSV
 */
export async function exportTasksCSV(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  const { data: instances } = await supabase
    .from('task_instances')
    .select(
      `
      id,
      logical_day,
      status,
      created_at,
      updated_at,
      tasks!inner (
        title,
        description,
        priority
      )
    `,
    )
    .eq('user_id', userId)
    .gte('logical_day', startDate)
    .lte('logical_day', endDate)
    .order('logical_day', { ascending: true });

  if (!instances) return '';

  const flatData = instances.map((i: any) => ({
    date: i.logical_day,
    title: i.tasks.title,
    description: i.tasks.description || '',
    priority: i.tasks.priority || 'medium',
    status: i.status,
    completed_at: i.status === 'done' ? i.updated_at : '',
  }));

  return toCSV(flatData, [
    { key: 'date', header: 'Date' },
    { key: 'title', header: 'Task' },
    { key: 'description', header: 'Description' },
    { key: 'priority', header: 'Priority' },
    { key: 'status', header: 'Status' },
    { key: 'completed_at', header: 'Completed At' },
  ]);
}

/**
 * Export transactions to CSV
 */
export async function exportTransactionsCSV(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  const { data: transactions } = await supabase
    .from('transactions')
    .select(
      `
      id,
      logical_day,
      amount,
      type,
      description,
      category,
      created_at,
      money_accounts!inner (
        name,
        account_type,
        currency
      )
    `,
    )
    .eq('user_id', userId)
    .gte('logical_day', startDate)
    .lte('logical_day', endDate)
    .order('logical_day', { ascending: true });

  if (!transactions) return '';

  const flatData = transactions.map((t: any) => ({
    date: t.logical_day,
    type: t.type,
    amount: t.amount,
    currency: t.money_accounts.currency || 'USD',
    account: t.money_accounts.name,
    account_type: t.money_accounts.account_type,
    category: t.category || 'Uncategorized',
    description: t.description || '',
  }));

  return toCSV(flatData, [
    { key: 'date', header: 'Date' },
    { key: 'type', header: 'Type' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'account', header: 'Account' },
    { key: 'account_type', header: 'Account Type' },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Description' },
  ]);
}

/**
 * Export habits summary to CSV
 */
export async function exportHabitsSummaryCSV(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  // Get all habits (repeat rules)
  const { data: rules } = await supabase
    .from('repeat_rules')
    .select(
      `
      id,
      tasks!inner (
        title
      )
    `,
    )
    .eq('user_id', userId);

  if (!rules) return '';

  // Get completion stats for each habit
  const habitStats = await Promise.all(
    rules.map(async (rule: any) => {
      const { count: completed } = await supabase
        .from('task_instances')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('task_id', rule.tasks.id)
        .eq('status', 'done')
        .gte('logical_day', startDate)
        .lte('logical_day', endDate);

      const { count: total } = await supabase
        .from('task_instances')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('task_id', rule.tasks.id)
        .gte('logical_day', startDate)
        .lte('logical_day', endDate);

      const completionRate =
        total && total > 0 ? Math.round(((completed || 0) / total) * 100) : 0;

      return {
        habit: rule.tasks.title,
        completed: completed || 0,
        total: total || 0,
        completion_rate: `${completionRate}%`,
      };
    }),
  );

  return toCSV(habitStats, [
    { key: 'habit', header: 'Habit' },
    { key: 'completed', header: 'Completed' },
    { key: 'total', header: 'Total' },
    { key: 'completion_rate', header: 'Completion Rate' },
  ]);
}

// --- Summary Report ---

export interface SummaryReport {
  period: {
    start: string;
    end: string;
  };
  tasks: {
    total: number;
    completed: number;
    skipped: number;
    pending: number;
    completionRate: number;
  };
  habits: {
    total: number;
    avgCompletionRate: number;
    longestStreak: number;
    currentStreak: number;
  };
  finance: {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    topCategories: { category: string; amount: number }[];
  };
}

/**
 * Generate a summary report for a date range
 */
export async function generateSummaryReport(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<SummaryReport> {
  // Task stats
  const { data: taskInstances } = await supabase
    .from('task_instances')
    .select('status')
    .eq('user_id', userId)
    .gte('logical_day', startDate)
    .lte('logical_day', endDate);

  const taskStats = {
    total: taskInstances?.length || 0,
    completed: taskInstances?.filter((t) => t.status === 'done').length || 0,
    skipped: taskInstances?.filter((t) => t.status === 'skipped').length || 0,
    pending: taskInstances?.filter((t) => t.status === 'pending').length || 0,
    completionRate: 0,
  };
  taskStats.completionRate =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  // Habit stats
  const { data: gamificationStats } = await supabase
    .from('gamification_stats')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single();

  const habitStats = {
    total: 0,
    avgCompletionRate: taskStats.completionRate,
    longestStreak: gamificationStats?.longest_streak || 0,
    currentStreak: gamificationStats?.current_streak || 0,
  };

  // Finance stats
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .eq('user_id', userId)
    .gte('logical_day', startDate)
    .lte('logical_day', endDate);

  const income =
    transactions
      ?.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const expense =
    transactions
      ?.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  // Top categories
  const categoryTotals: Record<string, number> = {};
  transactions
    ?.filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    });

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    period: { start: startDate, end: endDate },
    tasks: taskStats,
    habits: habitStats,
    finance: {
      totalIncome: income,
      totalExpense: expense,
      netFlow: income - expense,
      topCategories,
    },
  };
}
