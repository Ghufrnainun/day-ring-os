/**
 * Gamification System - Achievements & Levels
 *
 * Implements achievements derived from long-term consistency.
 * Points and levels are already implemented in gamification.ts.
 * This module adds achievement definitions and unlock logic.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Achievement categories
 */
export type AchievementCategory =
  | 'streak' // Streak-based achievements
  | 'consistency' // Consistent activity over time
  | 'milestone' // Point/level milestones
  | 'explorer' // Feature usage achievements
  | 'special'; // Special/seasonal achievements

/**
 * Achievement difficulty tiers
 */
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  requirement: AchievementRequirement;
  points: number;
}

/**
 * Achievement requirement types
 */
export type AchievementRequirement =
  | { type: 'streak'; days: number }
  | { type: 'total_habits'; count: number }
  | { type: 'total_points'; points: number }
  | { type: 'level'; level: number }
  | { type: 'active_days'; days: number }
  | { type: 'perfect_week'; weeks: number };

/**
 * Predefined achievements (unlocked based on long-term consistency)
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    category: 'streak',
    tier: 'bronze',
    icon: '🌱',
    requirement: { type: 'streak', days: 3 },
    points: 25,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    tier: 'silver',
    icon: '🔥',
    requirement: { type: 'streak', days: 7 },
    points: 50,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    category: 'streak',
    tier: 'gold',
    icon: '⭐',
    requirement: { type: 'streak', days: 30 },
    points: 150,
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    category: 'streak',
    tier: 'platinum',
    icon: '💎',
    requirement: { type: 'streak', days: 100 },
    points: 500,
  },

  // Milestone achievements
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    category: 'milestone',
    tier: 'bronze',
    icon: '📈',
    requirement: { type: 'level', level: 5 },
    points: 30,
  },
  {
    id: 'level_10',
    name: 'Orbit Explorer',
    description: 'Reach level 10',
    category: 'milestone',
    tier: 'silver',
    icon: '🚀',
    requirement: { type: 'level', level: 10 },
    points: 75,
  },
  {
    id: 'level_25',
    name: 'Orbit Veteran',
    description: 'Reach level 25',
    category: 'milestone',
    tier: 'gold',
    icon: '🏆',
    requirement: { type: 'level', level: 25 },
    points: 200,
  },

  // Consistency achievements
  {
    id: 'habits_50',
    name: 'Habit Builder',
    description: 'Complete 50 habits',
    category: 'consistency',
    tier: 'bronze',
    icon: '🎯',
    requirement: { type: 'total_habits', count: 50 },
    points: 40,
  },
  {
    id: 'habits_250',
    name: 'Habit Champion',
    description: 'Complete 250 habits',
    category: 'consistency',
    tier: 'silver',
    icon: '🏅',
    requirement: { type: 'total_habits', count: 250 },
    points: 100,
  },
  {
    id: 'habits_1000',
    name: 'Habit Legend',
    description: 'Complete 1,000 habits',
    category: 'consistency',
    tier: 'platinum',
    icon: '👑',
    requirement: { type: 'total_habits', count: 1000 },
    points: 500,
  },

  // Perfect week
  {
    id: 'perfect_week_1',
    name: 'Perfect Week',
    description: 'Complete all habits for 7 consecutive days',
    category: 'consistency',
    tier: 'silver',
    icon: '✨',
    requirement: { type: 'perfect_week', weeks: 1 },
    points: 75,
  },
];

/**
 * Check if user qualifies for an achievement
 */
export function checkAchievementEligibility(
  achievement: Achievement,
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    level: number;
    totalHabitsCompleted: number;
    perfectWeeks: number;
  },
): boolean {
  const req = achievement.requirement;

  switch (req.type) {
    case 'streak':
      return stats.longestStreak >= req.days;
    case 'level':
      return stats.level >= req.level;
    case 'total_points':
      return stats.totalPoints >= req.points;
    case 'total_habits':
      return stats.totalHabitsCompleted >= req.count;
    case 'perfect_week':
      return stats.perfectWeeks >= req.weeks;
    default:
      return false;
  }
}

/**
 * Get all unlocked achievements for a user
 */
export async function getUnlockedAchievements(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ achievement: Achievement; unlockedAt: string }[]> {
  // Fetch user's earned achievements from database
  const { data: earned } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId);

  if (!earned) return [];

  return earned
    .map((e) => ({
      achievement: ACHIEVEMENTS.find((a) => a.id === e.achievement_id),
      unlockedAt: e.unlocked_at,
    }))
    .filter(
      (e): e is { achievement: Achievement; unlockedAt: string } =>
        e.achievement !== undefined,
    );
}

/**
 * Check and unlock new achievements for a user
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string,
): Promise<Achievement[]> {
  // Get user stats
  const { data: stats } = await supabase
    .from('gamification_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!stats) return [];

  // Get habit completion count
  const { count: totalHabits } = await supabase
    .from('task_instances')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'done');

  // Get already unlocked achievements
  const { data: unlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlocked?.map((u) => u.achievement_id) || []);

  // Check each achievement
  const newlyUnlocked: Achievement[] = [];
  const userStats = {
    currentStreak: stats.current_streak || 0,
    longestStreak: stats.longest_streak || 0,
    totalPoints: stats.total_points || 0,
    level: stats.level || 1,
    totalHabitsCompleted: totalHabits || 0,
    perfectWeeks: 0, // Would need additional calculation
  };

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (unlockedIds.has(achievement.id)) continue;

    // Check eligibility
    if (checkAchievementEligibility(achievement, userStats)) {
      // Unlock the achievement
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
      });

      if (!error) {
        newlyUnlocked.push(achievement);

        // Award achievement points
        await supabase
          .from('gamification_stats')
          .update({
            total_points: stats.total_points + achievement.points,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Get achievement progress for display
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    level: number;
    totalHabitsCompleted: number;
    perfectWeeks: number;
  },
): { current: number; target: number; percentage: number } {
  const req = achievement.requirement;

  let current = 0;
  let target = 0;

  switch (req.type) {
    case 'streak':
      current = stats.longestStreak;
      target = req.days;
      break;
    case 'level':
      current = stats.level;
      target = req.level;
      break;
    case 'total_points':
      current = stats.totalPoints;
      target = req.points;
      break;
    case 'total_habits':
      current = stats.totalHabitsCompleted;
      target = req.count;
      break;
    case 'perfect_week':
      current = stats.perfectWeeks;
      target = req.weeks;
      break;
  }

  const percentage = Math.min(100, Math.round((current / target) * 100));

  return { current, target, percentage };
}
