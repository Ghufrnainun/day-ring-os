'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

export type BalanceLimitMode = 'strict' | 'soft' | 'none';

export interface BalanceValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  currentBalance?: number;
  projectedBalance?: number;
  minimumBalance?: number;
}

// ============================================
// Balance Validation
// ============================================

/**
 * Validate if a transaction would violate balance limits
 */
export async function validateTransactionBalance(
  accountId: string,
  amount: number,
  type: 'income' | 'expense',
): Promise<BalanceValidationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { valid: false, error: 'Unauthorized' };
  }

  // Get account details
  const { data: account, error } = await supabase
    .from('money_accounts')
    .select('balance, balance_limit_mode, minimum_balance, name')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single();

  if (error || !account) {
    return { valid: false, error: 'Account not found' };
  }

  // No validation if mode is 'none'
  if (account.balance_limit_mode === 'none') {
    return { valid: true };
  }

  // Calculate projected balance
  const currentBalance = Number(account.balance);
  const projectedBalance =
    type === 'expense' ? currentBalance - amount : currentBalance + amount;

  const minimumBalance = Number(account.minimum_balance || 0);
  const wouldExceedLimit = projectedBalance < minimumBalance;

  // Strict mode: block transaction
  if (account.balance_limit_mode === 'strict' && wouldExceedLimit) {
    return {
      valid: false,
      error: `Insufficient funds in ${account.name}. Balance would be $${projectedBalance.toFixed(2)}, minimum is $${minimumBalance.toFixed(2)}`,
      currentBalance,
      projectedBalance,
      minimumBalance,
    };
  }

  // Soft mode: allow but warn
  if (account.balance_limit_mode === 'soft' && wouldExceedLimit) {
    return {
      valid: true,
      warning: `Warning: ${account.name} balance will be $${projectedBalance.toFixed(2)}, below minimum of $${minimumBalance.toFixed(2)}`,
      currentBalance,
      projectedBalance,
      minimumBalance,
    };
  }

  return {
    valid: true,
    currentBalance,
    projectedBalance,
  };
}

/**
 * Update account balance limit settings
 */
export async function updateBalanceLimitSettings(
  accountId: string,
  mode: BalanceLimitMode,
  minimumBalance: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('money_accounts')
    .update({
      balance_limit_mode: mode,
      minimum_balance: minimumBalance,
    })
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Update Balance Limit Settings Error:', error);
    throw new Error('Failed to update balance limit settings');
  }

  return { success: true };
}

/**
 * Get accounts that are below their minimum balance
 */
export async function getAccountsBelowMinimum() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('money_accounts')
    .select('id, name, balance, minimum_balance, balance_limit_mode')
    .eq('user_id', user.id)
    .neq('balance_limit_mode', 'none')
    .is('deleted_at', null);

  if (error) {
    console.error('Get Accounts Below Minimum Error:', error);
    return [];
  }

  return (data || []).filter(
    (account) => Number(account.balance) < Number(account.minimum_balance || 0),
  );
}
