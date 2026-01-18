'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateTransactionInput {
  amount: number;
  type: 'expense' | 'income' | 'transfer' | 'investment';
  accountId: string;
  category: string;
  description?: string;
  date: string; // YYYY-MM-DD
  idempotencyKey: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Note: Currently only expense/income are implemented in RPC
  // Transfer and Investment types to be implemented in future
  if (input.type !== 'expense' && input.type !== 'income') {
    throw new Error('Transfer and Investment types coming soon');
  }

  // Use atomic RPC function for transaction + balance update
  const { data, error } = await supabase.rpc('create_transaction_atomic', {
    p_user_id: user.id,
    p_amount: input.amount,
    p_type: input.type,
    p_category: input.category,
    p_description: input.description || '',
    p_logical_day: input.date,
    p_account_id: input.accountId,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    console.error('Transaction Create Error:', error);
    throw new Error('Failed to create transaction');
  }

  // Handle RPC response
  const result = data as {
    success: boolean;
    duplicate?: boolean;
    transaction_id?: string;
    is_overdrawn?: boolean;
    error?: string;
  };

  if (!result.success) {
    throw new Error(result.error || 'Transaction failed');
  }

  if (result.duplicate) {
    return { success: true, message: 'Already processed', duplicate: true };
  }

  // Revalidate
  revalidatePath('/finance');
  revalidatePath('/today');

  return {
    success: true,
    transactionId: result.transaction_id,
    isOverdrawn: result.is_overdrawn || false,
  };
}
