'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(data: {
  displayName?: string;
  timezone?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const updates: any = {};
  if (data.displayName !== undefined) updates.display_name = data.displayName;
  if (data.timezone !== undefined) updates.timezone = data.timezone;
  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath('/settings');
  revalidatePath('/today'); // Timezone might affect today
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data;
}
