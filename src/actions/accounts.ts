'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface MoneyAccount {
  id: string;
  user_id: string;
  name: string;
  type: 'bank' | 'cash' | 'ewallet' | 'investment';
  currency_code: string;
  icon?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  deleted_at?: string;
}

export interface CreateAccountInput {
  name: string;
  type: 'bank' | 'cash' | 'ewallet' | 'investment';
  currency_code?: string;
  icon?: string;
  opening_balance?: number;
}

export async function getAccounts(): Promise<MoneyAccount[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('money_accounts')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name');

  if (error) throw error;
  return (data || []) as MoneyAccount[];
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<MoneyAccount> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('money_accounts')
    .insert({
      user_id: user.id,
      name: input.name,
      type: input.type,
      currency_code: input.currency_code || 'USD',
      icon: input.icon,
      opening_balance: input.opening_balance || 0,
      current_balance: input.opening_balance || 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/finance');
  return data as MoneyAccount;
}

export async function updateAccount(
  id: string,
  updates: Partial<Pick<MoneyAccount, 'name' | 'type' | 'icon' | 'is_active'>>,
): Promise<MoneyAccount> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('money_accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/finance');
  return data as MoneyAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Soft delete
  const { error } = await supabase
    .from('money_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  revalidatePath('/finance');
}
