'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// Entity Link Types
// ============================================

type EntityType = 'task' | 'note' | 'transaction';

export interface LinkedNote {
  id: string;
  title: string;
  template_type: string;
  updated_at: string;
}

export interface LinkedTask {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
}

export interface LinkedTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  transaction_date: string;
}

// ============================================
// Generic Link Helper
// ============================================

async function createEntityLink(
  sourceType: EntityType,
  sourceId: string,
  targetType: EntityType,
  targetId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if link already exists
  const { data: existing } = await supabase
    .from('entity_links')
    .select('id')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single();

  if (existing) {
    return { success: true, message: 'Already linked' };
  }

  // Create link
  const { error } = await supabase.from('entity_links').insert({
    source_type: sourceType,
    source_id: sourceId,
    target_type: targetType,
    target_id: targetId,
    user_id: user.id,
  });

  if (error) {
    console.error('Create Entity Link Error:', error);
    throw new Error('Failed to create link');
  }

  return { success: true };
}

async function deleteEntityLink(
  sourceType: EntityType,
  sourceId: string,
  targetType: EntityType,
  targetId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('entity_links')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete Entity Link Error:', error);
    throw new Error('Failed to delete link');
  }

  return { success: true };
}

// ============================================
// Notes ↔ Tasks Linking
// ============================================

export async function linkNoteToTask(noteId: string, taskId: string) {
  const result = await createEntityLink('note', noteId, 'task', taskId);
  revalidatePath('/notes');
  revalidatePath('/today');
  return result;
}

export async function unlinkNoteFromTask(noteId: string, taskId: string) {
  const result = await deleteEntityLink('note', noteId, 'task', taskId);
  revalidatePath('/notes');
  revalidatePath('/today');
  return result;
}

export async function getLinkedTasks(noteId: string): Promise<LinkedTask[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      target_id,
      tasks:target_id (
        id,
        title,
        status,
        scheduled_at
      )
    `,
    )
    .eq('source_type', 'note')
    .eq('source_id', noteId)
    .eq('target_type', 'task')
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Linked Tasks Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.tasks)
    .filter(Boolean) as LinkedTask[];
}

export async function getLinkedNotes(taskId: string): Promise<LinkedNote[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      source_id,
      notes:source_id (
        id,
        title,
        template_type,
        updated_at
      )
    `,
    )
    .eq('source_type', 'note')
    .eq('target_type', 'task')
    .eq('target_id', taskId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Linked Notes Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.notes)
    .filter(Boolean) as LinkedNote[];
}

// ============================================
// Transactions ↔ Notes Linking
// ============================================

export async function linkTransactionToNote(
  transactionId: string,
  noteId: string,
) {
  const result = await createEntityLink(
    'transaction',
    transactionId,
    'note',
    noteId,
  );
  revalidatePath('/finance');
  revalidatePath('/notes');
  return result;
}

export async function unlinkTransactionFromNote(
  transactionId: string,
  noteId: string,
) {
  const result = await deleteEntityLink(
    'transaction',
    transactionId,
    'note',
    noteId,
  );
  revalidatePath('/finance');
  revalidatePath('/notes');
  return result;
}

export async function getTransactionLinkedNotes(
  transactionId: string,
): Promise<LinkedNote[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      target_id,
      notes:target_id (
        id,
        title,
        template_type,
        updated_at
      )
    `,
    )
    .eq('source_type', 'transaction')
    .eq('source_id', transactionId)
    .eq('target_type', 'note')
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Transaction Linked Notes Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.notes)
    .filter(Boolean) as LinkedNote[];
}

export async function getNoteTransactions(
  noteId: string,
): Promise<LinkedTransaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      source_id,
      transactions:source_id (
        id,
        amount,
        type,
        category,
        description,
        transaction_date
      )
    `,
    )
    .eq('source_type', 'transaction')
    .eq('target_type', 'note')
    .eq('target_id', noteId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Note Transactions Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.transactions)
    .filter(Boolean) as LinkedTransaction[];
}

// ============================================
// Transactions ↔ Tasks Linking
// ============================================

export async function linkTransactionToTask(
  transactionId: string,
  taskId: string,
) {
  const result = await createEntityLink(
    'transaction',
    transactionId,
    'task',
    taskId,
  );
  revalidatePath('/finance');
  revalidatePath('/today');
  return result;
}

export async function unlinkTransactionFromTask(
  transactionId: string,
  taskId: string,
) {
  const result = await deleteEntityLink(
    'transaction',
    transactionId,
    'task',
    taskId,
  );
  revalidatePath('/finance');
  revalidatePath('/today');
  return result;
}

export async function getTransactionLinkedTasks(
  transactionId: string,
): Promise<LinkedTask[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      target_id,
      tasks:target_id (
        id,
        title,
        status,
        scheduled_at
      )
    `,
    )
    .eq('source_type', 'transaction')
    .eq('source_id', transactionId)
    .eq('target_type', 'task')
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Transaction Linked Tasks Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.tasks)
    .filter(Boolean) as LinkedTask[];
}

export async function getTaskTransactions(
  taskId: string,
): Promise<LinkedTransaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('entity_links')
    .select(
      `
      source_id,
      transactions:source_id (
        id,
        amount,
        type,
        category,
        description,
        transaction_date
      )
    `,
    )
    .eq('source_type', 'transaction')
    .eq('target_type', 'task')
    .eq('target_id', taskId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Get Task Transactions Error:', error);
    return [];
  }

  return (data || [])
    .map((link: any) => link.transactions)
    .filter(Boolean) as LinkedTransaction[];
}

// ============================================
// Search & Selection Helpers
// ============================================

export async function searchNotesForLinking(
  query: string,
  limit = 10,
): Promise<LinkedNote[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('notes')
    .select('id, title, template_type, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Search Notes Error:', error);
    return [];
  }

  return data as LinkedNote[];
}

export async function searchTasksForLinking(
  query: string,
  limit = 10,
): Promise<LinkedTask[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, scheduled_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .ilike('title', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Search Tasks Error:', error);
    return [];
  }

  return data as LinkedTask[];
}
