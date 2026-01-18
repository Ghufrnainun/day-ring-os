'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Points configuration
const POINTS_CONFIG = {
  HABIT_COMPLETION: 10,
  STREAK_BONUS_MULTIPLIER: 0.1, // 10% bonus per streak day (max 100%)
  DAILY_CAP: 100,
};

export interface GamificationStats {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  level: number;
  today_points: number;
  can_earn_more: boolean;
}

/**
 * Award points for habit completion
 * Only habits (repeat tasks) earn points, not one-off tasks
 */
export async function awardHabitPoints(
  taskId: string,
  dateString: string
): Promise<{ points: number; newTotal: number; streakBonus: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Verify this is a habit (has repeat_rule)
  const { data: rule } = await supabase
    .from('repeat_rules')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .single();

  if (!rule) {
    // Not a habit, no points awarded
    return { points: 0, newTotal: 0, streakBonus: 0 };
  }

  // Get current gamification stats
  const { data: stats, error: statsError } = await supabase
    .from('gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Initialize stats if not exists
  if (statsError || !stats) {
    await supabase.from('gamification_stats').insert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
      total_points: 0,
      level: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Check daily cap
  const { count: todayPoints } = await supabase
    .from('point_logs')
    .select('points', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('earned_date', dateString);

  const currentTodayPoints = todayPoints || 0;
  if (currentTodayPoints >= POINTS_CONFIG.DAILY_CAP) {
    return { points: 0, newTotal: stats?.total_points || 0, streakBonus: 0 };
  }

  // Calculate points with streak bonus
  const currentStreak = stats?.current_streak || 0;
  const streakMultiplier = Math.min(
    1 + currentStreak * POINTS_CONFIG.STREAK_BONUS_MULTIPLIER,
    2.0 // Max 2x multiplier
  );
  const basePoints = POINTS_CONFIG.HABIT_COMPLETION;
  const totalPoints = Math.round(basePoints * streakMultiplier);
  const streakBonus = totalPoints - basePoints;

  // Cap at daily limit
  const remainingCap = POINTS_CONFIG.DAILY_CAP - currentTodayPoints;
  const awardedPoints = Math.min(totalPoints, remainingCap);

  // Log points
  await supabase.from('point_logs').insert({
    user_id: user.id,
    task_id: taskId,
    points: awardedPoints,
    reason: 'habit_completion',
    earned_date: dateString,
    created_at: new Date().toISOString(),
  });

  // Update total
  const newTotal = (stats?.total_points || 0) + awardedPoints;
  const newLevel = calculateLevel(newTotal);

  await supabase
    .from('gamification_stats')
    .update({
      total_points: newTotal,
      level: newLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  return {
    points: awardedPoints,
    newTotal,
    streakBonus,
  };
}

/**
 * Update streak based on daily habit completion
 * Called at end of day or when checking stats
 */
export async function updateStreak(
  dateString: string
): Promise<{ streak: number; isNewRecord: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if user completed any habit today
  const { count: completedToday } = await supabase
    .from('task_instances')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('logical_day', dateString)
    .eq('status', 'done');

  // Get current stats
  const { data: stats } = await supabase
    .from('gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!stats) {
    // Initialize if not exists
    await supabase.from('gamification_stats').insert({
      user_id: user.id,
      current_streak: completedToday && completedToday > 0 ? 1 : 0,
      longest_streak: completedToday && completedToday > 0 ? 1 : 0,
      total_points: 0,
      level: 1,
      last_active_date:
        completedToday && completedToday > 0 ? dateString : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      streak: completedToday && completedToday > 0 ? 1 : 0,
      isNewRecord: completedToday && completedToday > 0 ? true : false,
    };
  }

  // Calculate streak
  let newStreak = stats.current_streak;
  const lastActiveDate = stats.last_active_date;

  if (completedToday && completedToday > 0) {
    // Check if this continues the streak
    const yesterday = new Date(dateString);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActiveDate === yesterdayStr) {
      // Continuing streak
      newStreak = stats.current_streak + 1;
    } else if (lastActiveDate === dateString) {
      // Already active today, no change
      newStreak = stats.current_streak;
    } else {
      // Starting new streak
      newStreak = 1;
    }
  } else {
    // No completion today - streak will be evaluated at end of day
    newStreak = stats.current_streak;
  }

  const isNewRecord = newStreak > (stats.longest_streak || 0);
  const longestStreak = isNewRecord ? newStreak : stats.longest_streak;

  await supabase
    .from('gamification_stats')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_active_date:
        completedToday && completedToday > 0 ? dateString : lastActiveDate,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  return { streak: newStreak, isNewRecord };
}

/**
 * Get user's gamification stats
 */
export async function getGamificationStats(): Promise<GamificationStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get stats
  const { data: stats } = await supabase
    .from('gamification_stats')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get today's points
  const today = new Date().toISOString().split('T')[0];
  const { data: todayLogs } = await supabase
    .from('point_logs')
    .select('points')
    .eq('user_id', user.id)
    .eq('earned_date', today);

  const todayPoints =
    todayLogs?.reduce((sum, log) => sum + (log.points || 0), 0) || 0;

  return {
    current_streak: stats?.current_streak || 0,
    longest_streak: stats?.longest_streak || 0,
    total_points: stats?.total_points || 0,
    level: stats?.level || 1,
    today_points: todayPoints,
    can_earn_more: todayPoints < POINTS_CONFIG.DAILY_CAP,
  };
}

/**
 * Calculate level from total points
 * Simple level curve: Level N requires N*100 points
 */
function calculateLevel(totalPoints: number): number {
  // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599...
  // Formula: level = floor(sqrt(points / 50)) + 1
  return Math.floor(Math.sqrt(totalPoints / 50)) + 1;
}

/**
 * Reset streak (called when user misses a day)
 * This is called by the end-of-day job
 */
export async function resetStreakIfMissed(dateString: string): Promise<void> {
  const supabase = await createClient();

  // Get all users with active streaks
  const { data: users } = await supabase
    .from('gamification_stats')
    .select('user_id, current_streak, last_active_date')
    .gt('current_streak', 0);

  if (!users) return;

  const yesterday = new Date(dateString);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  for (const user of users) {
    // If last active was before yesterday, reset streak
    if (user.last_active_date && user.last_active_date < yesterdayStr) {
      await supabase
        .from('gamification_stats')
        .update({
          current_streak: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.user_id);
    }
  }
}
