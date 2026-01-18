'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getLogicalDate, formatLogicalDate } from '@/lib/date-utils';

export type TaskStatus = 'pending' | 'completed' | 'skipped' | 'delayed';

export interface StatusUpdateResult {
  success: boolean;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  message?: string;
}

/**
 * Update task status with support for all states: pending, completed, skipped, delayed
 * Returns previous status to enable undo functionality
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  path: string = '/today'
): Promise<StatusUpdateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get current task to capture previous status
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('status, scheduled_at')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !task) {
    throw new Error('Task not found');
  }

  const previousStatus = task.status as TaskStatus;

  // Prepare update payload
  const updatePayload: Record<string, any> = {
    status: newStatus,
  };

  // Handle delayed tasks - move to next day
  if (newStatus === 'delayed') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('user_id', user.id)
      .single();

    const timezone = profile?.timezone || 'UTC';
    const today = getLogicalDate(timezone);

    // Add one day
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Keep the same time if it exists, otherwise set to 9 AM
    if (task.scheduled_at) {
      const originalDate = new Date(task.scheduled_at);
      tomorrow.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        0,
        0
      );
    } else {
      tomorrow.setHours(9, 0, 0, 0);
    }

    updatePayload.scheduled_at = tomorrow.toISOString();
    updatePayload.status = 'pending'; // Delayed tasks become pending for next day
  }

  // Handle completed tasks - set completed_at timestamp
  if (newStatus === 'completed') {
    updatePayload.completed_at = new Date().toISOString();
  } else if (previousStatus === 'completed') {
    // Clearing completion
    updatePayload.completed_at = null;
  }

  // Update the task
  const { error: updateError } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (updateError) {
    throw new Error('Failed to update task status');
  }

  revalidatePath(path);

  return {
    success: true,
    previousStatus,
    newStatus: newStatus === 'delayed' ? 'pending' : newStatus,
    message: getStatusMessage(newStatus),
  };
}

/**
 * Restore task to previous status (undo operation)
 */
export async function undoTaskStatus(
  taskId: string,
  previousStatus: TaskStatus,
  path: string = '/today'
): Promise<StatusUpdateResult> {
  return updateTaskStatus(taskId, previousStatus, path);
}

/**
 * Update habit instance status
 */
export async function updateHabitStatus(
  taskId: string,
  dateString: string,
  newStatus: 'done' | 'pending' | 'skipped',
  path: string = '/today'
): Promise<StatusUpdateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get current instance
  const { data: instance, error: fetchError } = await supabase
    .from('task_instances')
    .select('status')
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('logical_day', dateString)
    .single();

  if (fetchError || !instance) {
    throw new Error('Habit instance not found');
  }

  const previousStatus = instance.status as TaskStatus;

  // Update instance
  const { error: updateError } = await supabase
    .from('task_instances')
    .update({
      status: newStatus,
      confirmed_at: newStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('user_id', user.id)
    .eq('task_id', taskId)
    .eq('logical_day', dateString);

  if (updateError) {
    throw new Error('Failed to update habit status');
  }

  // Award points for habit completion (gamification)
  let pointsMessage = '';
  // Note: task_instances uses 'done' status, cast to string for comparison
  if (newStatus === 'done' && (previousStatus as string) !== 'done') {
    try {
      const { awardHabitPoints, updateStreak } = await import('./gamification');
      const { points, streakBonus } = await awardHabitPoints(
        taskId,
        dateString
      );
      await updateStreak(dateString);
      if (points > 0) {
        pointsMessage =
          streakBonus > 0
            ? ` +${points} pts (incl. streak bonus!)`
            : ` +${points} pts`;
      }
    } catch (e) {
      // Gamification is non-critical, don't fail the action
      console.error('Gamification error:', e);
    }
  }

  revalidatePath(path);

  return {
    success: true,
    previousStatus,
    newStatus: newStatus as TaskStatus,
    message: getHabitStatusMessage(newStatus) + pointsMessage,
  };
}

function getStatusMessage(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Nice work! Task completed.';
    case 'skipped':
      return 'Task skipped for today.';
    case 'delayed':
      return 'Task moved to tomorrow.';
    case 'pending':
      return 'Task restored.';
    default:
      return 'Status updated.';
  }
}

function getHabitStatusMessage(status: string): string {
  switch (status) {
    case 'done':
      return 'Habit confirmed!';
    case 'skipped':
      return 'Habit skipped for today.';
    case 'pending':
      return 'Habit restored.';
    default:
      return 'Status updated.';
  }
}
