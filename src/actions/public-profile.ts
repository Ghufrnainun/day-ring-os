'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// Public Profile Types
// ============================================

export interface PublicProfileStats {
  display_name: string | null;
  username: string;
  activity_heatmap: Array<{ date: string; count: number }>;
  stats: {
    total_tasks_completed: number;
    total_habits_completed: number;
    current_streak: number;
  };
}

// ============================================
// Public Profile Actions
// ============================================

/**
 * Get public profile data by username (no auth required)
 */
export async function getPublicProfile(
  username: string,
): Promise<PublicProfileStats | null> {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, display_name, username, public_profile_enabled')
    .eq('username', username)
    .single();

  if (!profile || !profile.public_profile_enabled) {
    return null; // Profile is private or doesn't exist
  }

  // Calculate date range (last 365 days)
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setDate(today.getDate() - 365);
  const startDate = oneYearAgo.toISOString().split('T')[0];

  // Get activity data from daily_snapshots
  const { data: snapshots } = await supabase
    .from('daily_snapshots')
    .select('logical_day, tasks_done, habits_done')
    .eq('user_id', profile.user_id)
    .gte('logical_day', startDate)
    .order('logical_day', { ascending: true });

  // Transform to heatmap format
  const activity_heatmap =
    snapshots?.map((s) => ({
      date: s.logical_day,
      count: (s.tasks_done || 0) + (s.habits_done || 0),
    })) || [];

  // Get gamification stats for streak
  const { data: stats } = await supabase
    .from('gamification_stats')
    .select('current_streak')
    .eq('user_id', profile.user_id)
    .single();

  // Calculate totals
  const total_tasks =
    snapshots?.reduce((sum, s) => sum + (s.tasks_done || 0), 0) || 0;
  const total_habits =
    snapshots?.reduce((sum, s) => sum + (s.habits_done || 0), 0) || 0;

  return {
    display_name: profile.display_name,
    username: profile.username,
    activity_heatmap,
    stats: {
      total_tasks_completed: total_tasks,
      total_habits_completed: total_habits,
      current_streak: stats?.current_streak || 0,
    },
  };
}

/**
 * Toggle public profile on/off (auth required)
 */
export async function togglePublicProfile(enabled: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ public_profile_enabled: enabled })
    .eq('user_id', user.id);

  if (error) {
    console.error('Toggle public profile error:', error);
    throw new Error('Failed to update profile visibility');
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Update username (auth required)
 */
export async function updateUsername(newUsername: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate username format
  const usernameRegex = /^[a-z0-9-]{3,20}$/;
  if (!usernameRegex.test(newUsername)) {
    throw new Error(
      'Username must be 3-20 characters, lowercase letters, numbers, and hyphens only',
    );
  }

  // Check availability
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', newUsername)
    .neq('user_id', user.id)
    .single();

  if (existing) {
    throw new Error('Username already taken');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('user_id', user.id);

  if (error) {
    console.error('Update username error:', error);
    throw new Error('Failed to update username');
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  return !data; // Available if no data found
}
