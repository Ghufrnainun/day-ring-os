'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ensureInstancesForDay } from '@/lib/logic/ensure-instances';

export interface TodayData {
  tasks: any[];
  habits: any[];
  finance: {
    income: number;
    expense: number;
    balance: number;
  };
}

export async function getTodayData(
  dateString: string,
  timezone: string
): Promise<TodayData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // 1. Ensure Habit Instances for Today
  try {
    await ensureInstancesForDay(supabase, user.id, dateString, timezone);
  } catch (err) {
    console.error('Failed to ensure instances:', err);
  }

  // 2. Fetch One-Off Tasks (is_template = false)
  // Scheduled for today or overdue
  // Note: Schema uses 'scheduled_at' (TIMESTAMPTZ), so date comparison needs range or cast.
  // Converting dateString (YYYY-MM-DD) to range for simple comparison if needed,
  // but for MVP assuming client might send range or we use specific logic.
  // Actually, let's just fetch ALL pending non-template tasks + Done today tasks.
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_template', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: true }); // Simple ordering for now

  if (tasksError) throw tasksError;

  // Filter in memory for "Today" relevance
  // Only show tasks scheduled for this specific date
  const relevantTasks = tasks.filter((t) => {
    if (!t.scheduled_at) return false; // Unscheduled tasks don't show on any specific day view

    // Extract date portion from scheduled_at timestamp
    const scheduledDate = t.scheduled_at.split('T')[0];
    return scheduledDate === dateString;
  });

  // 3. Fetch Habits (Repeat Rules + Linked Tasks + Instances)
  const { data: habits, error: habitsError } = await supabase
    .from('repeat_rules')
    .select(
      `
      *,
      task:tasks!inner(title, description, is_template)
    `
    )
    .eq('user_id', user.id);

  if (habitsError) throw habitsError;

  // 4. Fetch Instances for Today (Completion Status)
  const { data: instances, error: instancesError } = await supabase
    .from('task_instances')
    .select('*')
    .eq('user_id', user.id)
    .eq('logical_day', dateString);

  if (instancesError) throw instancesError;

  // Merge Habits + Instances
  // We want to show ALL habits that are relevant for today.
  // ensureInstancesForDay already created instances for relevant ones.
  // So we just look at 'instances' and join back to habits?
  // Actually, we want to list them.
  // Better: Map over `habits` (rules) and check if an instance exists for today.
  // If ensuresInstances worked, relevant ones HAVE an instance.
  // If a habit wasn't scheduled for today (e.g. weekly on wrong day), it won't have an instance.
  // So we only show habits that HAVE an instance today.

  const habitList = instances
    .map((instance) => {
      // Find the rule that links to this task
      const rule = habits.find((h) => h.task_id === instance.task_id);
      if (!rule) return null; // Orphaned instance (shouldn't happen) or non-rule instance

      return {
        id: instance.task_id, // Identify by Task ID (which is the habit template ID)
        title: rule.task.title,
        completed: instance.status === 'done', // Map 'done' to boolean
        instance_id: instance.id,
        rule_config: rule.rule_config,
      };
    })
    .filter(Boolean);

  // 5. Finance Snapshot
  const { data: transactions, error: financeError } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id)
    .eq('logical_day', dateString);

  if (financeError) throw financeError;

  const finance = (transactions || []).reduce(
    (acc, curr) => {
      if (curr.type === 'income') acc.income += Number(curr.amount);
      if (curr.type === 'expense') acc.expense += Number(curr.amount);
      return acc;
    },
    { income: 0, expense: 0, balance: 0 }
  );
  finance.balance = finance.income - finance.expense;

  return {
    tasks: relevantTasks || [],
    habits: habitList,
    finance,
  };
}

export async function toggleTask(
  taskId: string,
  currentStatus: string,
  path: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

  // For one-off tasks in 'tasks' table
  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus }) // 'completed_at' removed from update for simplicity unless column exists
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (error) throw error;
  revalidatePath(path);
}

export async function trackHabit(
  taskId: string, // This is the Task ID (Template ID)
  dateString: string,
  done: boolean,
  path: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const status = done ? 'done' : 'pending'; // PRD says 'done', 'skipped', 'pending', 'delayed'
  const confirmedAt = done ? new Date().toISOString() : null;

  // We update the EXISTING instance created by ensureInstances
  const { error } = await supabase
    .from('task_instances')
    .update({
      status,
      confirmed_at: confirmedAt,
    })
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('logical_day', dateString);

  if (error) throw error;
  revalidatePath(path);
}
