'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getLogicalDate, formatLogicalDate } from '@/lib/date-utils';
import { fromZonedTime } from 'date-fns-tz';

export async function createTask(formData: FormData, scheduledDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const time = formData.get('time') as string; // Optional HH:MM
  const priority = (formData.get('priority') as string) || 'medium';

  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  // Resolve Logical Day
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .single();

  const timezone = profile?.timezone || 'UTC';

  // Use provided date OR today's logical date
  const dateString =
    scheduledDate || formatLogicalDate(getLogicalDate(timezone));

  // Construct Scheduled At (TIMESTAMPTZ)
  let scheduledAtIso: string;
  try {
    const timeStr = time || '09:00'; // Default to 9 AM if no time specified
    const localDateTimeStr = `${dateString}T${timeStr}:00`;
    const zonedDate = fromZonedTime(localDateTimeStr, timezone);
    scheduledAtIso = zonedDate.toISOString();
  } catch (e) {
    // Fallback
    scheduledAtIso = new Date().toISOString();
  }

  // Construct Data
  const taskData = {
    user_id: user.id,
    title: title.trim(),
    status: 'pending',
    priority,
    scheduled_at: scheduledAtIso,
  };

  const { error } = await supabase.from('tasks').insert(taskData);

  if (error) {
    console.error('Create Task Error:', error);
    throw new Error('Failed to create task');
  }

  revalidatePath('/today');
}
