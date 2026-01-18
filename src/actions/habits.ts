'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateHabitInput {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  reminderTime?: string; // HH:mm
}

export async function createHabit(input: CreateHabitInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // 1. Create the Task Template
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      is_template: true, // Mark as habit template
    })
    .select()
    .single();

  if (taskError || !task) {
    console.error('Habit Task Create Error:', taskError);
    throw new Error('Failed to create habit task');
  }

  // 2. Create Repeat Rule
  const { error: ruleError } = await supabase.from('repeat_rules').insert({
    user_id: user.id,
    task_id: task.id,
    rule_type: input.frequency,
    rule_config: {}, // Empty for daily/weekly implies simple frequency
  });

  if (ruleError) {
    console.error('Repeat Rule Error:', ruleError);
    // Cleanup task if rule fails (manual rollback since no transactions in neat Supabase client)
    await supabase.from('tasks').delete().eq('id', task.id);
    throw new Error('Failed to create habit rule');
  }

  // 3. Create Reminder (Optional)
  if (input.reminderTime) {
    // Extract just the time (HH:MM) for the remind_at TIME column
    const [hours, minutes] = input.reminderTime.split(':');
    const timeString = `${hours}:${minutes}:00`; // HH:MM:SS format for TIME column

    await supabase.from('reminders').insert({
      user_id: user.id,
      task_id: task.id,
      title: `${input.title} reminder`, // Add title
      remind_at: timeString, // Use TIME column, not TIMESTAMPTZ
      delivery_method: 'email', // Use delivery_method, not channel
      enabled: true, // Use enabled, not is_active
    });
  }

  // 4. Instant Gratification: Create Instance for Today?
  // Logic: If frequency is 'daily', yes.
  // If 'weekly', checking if today matches (logic can be complex, skipping for simplicty unless 'daily').

  if (input.frequency === 'daily') {
    // Get logical day
    // We need the user's timezone to do this perfectly on server,
    // but for now we can fetch the profile or passed in logical day.
    // Let's rely on the client passing the logical day or just use UTC date string if simpler
    // Ideally we fetch profile.

    // Fetch profile for timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('user_id', user.id)
      .single();

    const timezone = profile?.timezone || 'UTC';
    // Simple logical day calc
    const now = new Date();
    const logicalDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
    }).format(now); // YYYY-MM-DD

    // Create Instance
    await supabase.from('task_instances').insert({
      user_id: user.id,
      task_id: task.id,
      logical_day: logicalDay,
      status: 'pending',
    });
  }

  revalidatePath('/today');
  return { success: true, data: task };
}
