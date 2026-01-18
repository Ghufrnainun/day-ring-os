'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  remind_at: string;
  delivery_method: 'email' | 'push';
  enabled: boolean;
  created_at: string;
  updated_at: string;
  task?: {
    title: string;
  };
}

export interface CreateReminderInput {
  title: string;
  remind_at: string; // HH:MM format
  task_id?: string;
  delivery_method?: 'email' | 'push';
}

export interface UpdateReminderInput {
  id: string;
  title?: string;
  remind_at?: string;
  task_id?: string | null;
  delivery_method?: 'email' | 'push';
  enabled?: boolean;
}

/**
 * Get all reminders for the current user
 */
export async function getReminders(): Promise<Reminder[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Return empty array for unauthenticated users instead of throwing
    return [];
  }

  const { data, error } = await supabase
    .from('reminders')
    .select(
      `
      *,
      task:tasks(title)
    `,
    )
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  if (error) {
    // Log error but return empty array to avoid blocking UI
    console.error('Get reminders error:', error);
    return [];
  }

  return (data || []) as Reminder[];
}

/**
 * Create a new reminder
 */
export async function createReminder(
  input: CreateReminderInput,
): Promise<Reminder> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!input.title?.trim()) {
    throw new Error('Reminder title is required');
  }

  if (!input.remind_at) {
    throw new Error('Reminder time is required');
  }

  const reminderData = {
    user_id: user.id,
    title: input.title.trim(),
    remind_at: input.remind_at,
    task_id: input.task_id || null,
    delivery_method: input.delivery_method || 'email',
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('reminders')
    .insert(reminderData)
    .select()
    .single();

  if (error) {
    console.error('Create reminder error:', error);
    throw new Error('Failed to create reminder');
  }

  revalidatePath('/settings');
  return data as Reminder;
}

/**
 * Update an existing reminder
 */
export async function updateReminder(
  input: UpdateReminderInput,
): Promise<Reminder> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.remind_at !== undefined) updateData.remind_at = input.remind_at;
  if (input.task_id !== undefined) updateData.task_id = input.task_id;
  if (input.delivery_method !== undefined)
    updateData.delivery_method = input.delivery_method;
  if (input.enabled !== undefined) updateData.enabled = input.enabled;

  const { data, error } = await supabase
    .from('reminders')
    .update(updateData)
    .eq('id', input.id)
    .eq('user_id', user.id) // Security: ensure user owns this reminder
    .select()
    .single();

  if (error) {
    console.error('Update reminder error:', error);
    throw new Error('Failed to update reminder');
  }

  revalidatePath('/settings');
  return data as Reminder;
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Security: ensure user owns this reminder

  if (error) {
    console.error('Delete reminder error:', error);
    throw new Error('Failed to delete reminder');
  }

  revalidatePath('/settings');
}

/**
 * Toggle reminder enabled state
 */
export async function toggleReminder(
  id: string,
  enabled: boolean,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('reminders')
    .update({
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Toggle reminder error:', error);
    throw new Error('Failed to toggle reminder');
  }

  revalidatePath('/settings');
}
