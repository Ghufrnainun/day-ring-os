'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveNote(note: {
  id?: string;
  title: string;
  content: any; // JSONB
  template_type: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const payload: any = {
    user_id: user.id,
    title: note.title || 'Untitled Note',
    content: note.content,
    template_type: note.template_type,
    updated_at: new Date().toISOString(),
  };

  if (note.id) {
    payload.id = note.id;
  }

  const { error } = await supabase.from('notes').upsert(payload);

  if (error) {
    console.error('Save Note Error:', error);
    throw new Error('Failed to save note');
  }

  revalidatePath('/notes');
  revalidatePath('/today');
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Soft delete preferred as per agents.md
  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete Note Error:', error);
    throw new Error('Failed to delete note');
  }

  revalidatePath('/notes');
}

export interface ConvertChecklistInput {
  noteId: string;
  itemText: string;
  timezone?: string;
}

/**
 * Convert a checklist item from a note into a standalone task
 * Links the task back to the source note
 */
export async function convertChecklistItemToTask(input: ConvertChecklistInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!input.itemText?.trim()) {
    throw new Error('Item text is required');
  }

  // Get the note to verify ownership
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, title')
    .eq('id', input.noteId)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    throw new Error('Note not found');
  }

  // Get user timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .single();

  const timezone = input.timezone || profile?.timezone || 'UTC';

  // Calculate logical day for scheduling
  const now = new Date();
  const { getLogicalDate, formatLogicalDate } = await import(
    '@/lib/date-utils'
  );
  const { fromZonedTime } = await import('date-fns-tz');

  const logicalDate = getLogicalDate(timezone);
  const dateString = formatLogicalDate(logicalDate);

  // Create task scheduled for today at 9 AM
  const localDateTime = `${dateString}T09:00:00`;
  const zonedDate = fromZonedTime(localDateTime, timezone);

  // Create the task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.itemText.trim(),
      status: 'pending',
      priority: 'medium',
      scheduled_at: zonedDate.toISOString(),
      linked_note_id: input.noteId, // Link back to source note
      metadata: {
        source: 'note_checklist',
        source_note_title: note.title,
      },
    })
    .select()
    .single();

  if (taskError) {
    console.error('Convert checklist error:', taskError);
    throw new Error('Failed to create task');
  }

  revalidatePath('/notes');
  revalidatePath('/today');

  return {
    success: true,
    taskId: task.id,
    taskTitle: task.title,
  };
}
