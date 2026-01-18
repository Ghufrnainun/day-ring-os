'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  calculateNextOccurrence,
  generateRRule,
  type RecurringFrequency,
} from '@/lib/rrule-utils';

// ============================================
// Types
// ============================================

export interface RecurringTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  from_account_id: string | null;
  to_account_id: string | null;
  rrule: string;
  is_active: boolean;
  next_occurrence: string;
  last_generated_date: string | null;
  created_at: string;
  updated_at: string;
}

// Re-export for convenience
export { generateRRule, type RecurringFrequency };

// ============================================
// CRUD Operations
// ============================================

export async function createRecurringTransaction(data: {
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  from_account_id?: string;
  to_account_id?: string;
  rrule: string;
  start_date?: Date;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Calculate next occurrence
  const nextOccurrence = calculateNextOccurrence(data.rrule, data.start_date);

  const { error } = await supabase.from('recurring_transactions').insert({
    user_id: user.id,
    amount: data.amount,
    type: data.type,
    category: data.category || null,
    description: data.description || null,
    from_account_id: data.from_account_id || null,
    to_account_id: data.to_account_id || null,
    rrule: data.rrule,
    next_occurrence: nextOccurrence.toISOString().split('T')[0],
  });

  if (error) {
    console.error('Create Recurring Transaction Error:', error);
    throw new Error('Failed to create recurring transaction');
  }

  revalidatePath('/finance');
  return { success: true };
}

export async function getRecurringTransactions(): Promise<
  RecurringTransaction[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('next_occurrence', { ascending: true });

  if (error) {
    console.error('Get Recurring Transactions Error:', error);
    return [];
  }

  return data as RecurringTransaction[];
}

export async function toggleRecurringTransaction(
  id: string,
  isActive: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Toggle Recurring Transaction Error:', error);
    throw new Error('Failed to toggle recurring transaction');
  }

  revalidatePath('/finance');
  return { success: true };
}

export async function deleteRecurringTransaction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete Recurring Transaction Error:', error);
    throw new Error('Failed to delete recurring transaction');
  }

  revalidatePath('/finance');
  return { success: true };
}

// ============================================
// Generation (for Cron Job)
// ============================================

/**
 * Generate transactions from recurring templates
 * Called by cron job daily
 */
export async function generateDueRecurringTransactions() {
  const supabase = await createClient();

  // Get all active recurring transactions due today or earlier
  const today = new Date().toISOString().split('T')[0];

  const { data: dueRecurring, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('is_active', true)
    .lte('next_occurrence', today);

  if (fetchError) {
    console.error('Fetch Due Recurring Error:', fetchError);
    return { success: false, generated: 0 };
  }

  let generated = 0;

  for (const recurring of dueRecurring || []) {
    try {
      // Create transaction from template
      const { error: createError } = await supabase
        .from('transactions')
        .insert({
          user_id: recurring.user_id,
          amount: recurring.amount,
          type: recurring.type,
          category: recurring.category,
          description: recurring.description,
          from_account_id: recurring.from_account_id,
          to_account_id: recurring.to_account_id,
          transaction_date: recurring.next_occurrence,
          recurring_transaction_id: recurring.id,
        });

      if (createError) {
        console.error(
          `Failed to generate transaction for ${recurring.id}:`,
          createError,
        );
        continue;
      }

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(
        recurring.rrule,
        new Date(recurring.next_occurrence),
      );

      // Update recurring transaction
      await supabase
        .from('recurring_transactions')
        .update({
          last_generated_date: recurring.next_occurrence,
          next_occurrence: nextOccurrence.toISOString().split('T')[0],
        })
        .eq('id', recurring.id);

      generated++;
    } catch (error) {
      console.error(
        `Error processing recurring transaction ${recurring.id}:`,
        error,
      );
    }
  }

  return { success: true, generated };
}
