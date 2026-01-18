import { describe, it, expect } from 'vitest';

/**
 * Streak Calculation Tests
 *
 * Tests the pure logic of streak calculation extracted from gamification.ts
 * These are unit tests for the streak algorithm, independent of database.
 */

// --- Pure function extracted from gamification.ts logic ---
interface StreakInput {
  currentStreak: number;
  lastActiveDate: string | null;
  todayDate: string;
  completedHabitsToday: number;
}

interface StreakOutput {
  newStreak: number;
  isNewRecord: boolean;
  shouldUpdateLastActive: boolean;
}

/**
 * Calculate new streak value based on inputs
 * This is a pure function version of the streak logic
 */
function calculateStreakUpdate(
  input: StreakInput,
  longestStreak: number = 0,
): StreakOutput {
  const { currentStreak, lastActiveDate, todayDate, completedHabitsToday } =
    input;

  let newStreak = currentStreak;
  let shouldUpdateLastActive = false;

  if (completedHabitsToday > 0) {
    // Check if this continues the streak
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActiveDate === yesterdayStr) {
      // Continuing streak
      newStreak = currentStreak + 1;
      shouldUpdateLastActive = true;
    } else if (lastActiveDate === todayDate) {
      // Already active today, no change
      newStreak = currentStreak;
    } else {
      // Starting new streak (gap in activity)
      newStreak = 1;
      shouldUpdateLastActive = true;
    }
  } else {
    // No completion today - streak unchanged until end of day
    newStreak = currentStreak;
  }

  const isNewRecord = newStreak > longestStreak;

  return { newStreak, isNewRecord, shouldUpdateLastActive };
}

/**
 * Check if streak should be reset (end of day logic)
 */
function shouldResetStreak(
  lastActiveDate: string | null,
  todayDate: string,
): boolean {
  if (!lastActiveDate) return false;

  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Reset if last active was before yesterday
  return lastActiveDate < yesterdayStr;
}

// --- Tests ---

describe('Streak Calculation', () => {
  describe('calculateStreakUpdate', () => {
    it('starts new streak when first habit completed', () => {
      const result = calculateStreakUpdate({
        currentStreak: 0,
        lastActiveDate: null,
        todayDate: '2024-01-15',
        completedHabitsToday: 1,
      });

      expect(result.newStreak).toBe(1);
      expect(result.isNewRecord).toBe(true);
      expect(result.shouldUpdateLastActive).toBe(true);
    });

    it('continues streak when completed day after last active', () => {
      const result = calculateStreakUpdate(
        {
          currentStreak: 3,
          lastActiveDate: '2024-01-14',
          todayDate: '2024-01-15',
          completedHabitsToday: 1,
        },
        3,
      );

      expect(result.newStreak).toBe(4);
      expect(result.isNewRecord).toBe(true);
      expect(result.shouldUpdateLastActive).toBe(true);
    });

    it('resets to 1 when there was a gap', () => {
      const result = calculateStreakUpdate({
        currentStreak: 5,
        lastActiveDate: '2024-01-12', // 3 days ago
        todayDate: '2024-01-15',
        completedHabitsToday: 1,
      });

      expect(result.newStreak).toBe(1);
      expect(result.shouldUpdateLastActive).toBe(true);
    });

    it('maintains streak when already active today', () => {
      const result = calculateStreakUpdate({
        currentStreak: 5,
        lastActiveDate: '2024-01-15', // Same day
        todayDate: '2024-01-15',
        completedHabitsToday: 2,
      });

      expect(result.newStreak).toBe(5);
      expect(result.shouldUpdateLastActive).toBe(false);
    });

    it('does not change streak when no habits completed', () => {
      const result = calculateStreakUpdate({
        currentStreak: 5,
        lastActiveDate: '2024-01-14',
        todayDate: '2024-01-15',
        completedHabitsToday: 0,
      });

      expect(result.newStreak).toBe(5);
      expect(result.shouldUpdateLastActive).toBe(false);
    });

    it('correctly identifies new records', () => {
      const result = calculateStreakUpdate(
        {
          currentStreak: 9,
          lastActiveDate: '2024-01-14',
          todayDate: '2024-01-15',
          completedHabitsToday: 1,
        },
        10, // Current longest is 10
      );

      expect(result.newStreak).toBe(10);
      expect(result.isNewRecord).toBe(false); // Equal to, not greater than

      const result2 = calculateStreakUpdate(
        {
          currentStreak: 10,
          lastActiveDate: '2024-01-14',
          todayDate: '2024-01-15',
          completedHabitsToday: 1,
        },
        10,
      );

      expect(result2.newStreak).toBe(11);
      expect(result2.isNewRecord).toBe(true);
    });
  });

  describe('shouldResetStreak', () => {
    it('returns false when no last active date', () => {
      expect(shouldResetStreak(null, '2024-01-15')).toBe(false);
    });

    it('returns false when last active was yesterday', () => {
      expect(shouldResetStreak('2024-01-14', '2024-01-15')).toBe(false);
    });

    it('returns true when last active was before yesterday', () => {
      expect(shouldResetStreak('2024-01-13', '2024-01-15')).toBe(true);
      expect(shouldResetStreak('2024-01-10', '2024-01-15')).toBe(true);
    });

    it('returns false when last active is today', () => {
      expect(shouldResetStreak('2024-01-15', '2024-01-15')).toBe(false);
    });

    it('handles month boundaries correctly', () => {
      // Feb 1 - last active Jan 31 (yesterday)
      expect(shouldResetStreak('2024-01-31', '2024-02-01')).toBe(false);

      // Feb 1 - last active Jan 30 (2 days ago)
      expect(shouldResetStreak('2024-01-30', '2024-02-01')).toBe(true);
    });

    it('handles year boundaries correctly', () => {
      // Jan 1 - last active Dec 31 (yesterday)
      expect(shouldResetStreak('2023-12-31', '2024-01-01')).toBe(false);

      // Jan 1 - last active Dec 30 (2 days ago)
      expect(shouldResetStreak('2023-12-30', '2024-01-01')).toBe(true);
    });

    it('handles leap year correctly', () => {
      // March 1, 2024 (leap year) - last active Feb 29
      expect(shouldResetStreak('2024-02-29', '2024-03-01')).toBe(false);

      // March 1, 2024 - last active Feb 28
      expect(shouldResetStreak('2024-02-28', '2024-03-01')).toBe(true);
    });
  });
});

describe('Level Calculation', () => {
  /**
   * Level formula: floor(sqrt(points / 50)) + 1
   */
  function calculateLevel(totalPoints: number): number {
    return Math.floor(Math.sqrt(totalPoints / 50)) + 1;
  }

  it('starts at level 1 with 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('stays level 1 until 50 points', () => {
    expect(calculateLevel(49)).toBe(1);
  });

  it('reaches level 2 at 50 points', () => {
    expect(calculateLevel(50)).toBe(2);
  });

  it('reaches level 3 at 200 points', () => {
    expect(calculateLevel(200)).toBe(3);
  });

  it('reaches level 4 at 450 points', () => {
    expect(calculateLevel(450)).toBe(4);
  });

  it('reaches level 5 at 800 points', () => {
    expect(calculateLevel(800)).toBe(5);
  });

  it('handles large point values', () => {
    expect(calculateLevel(5000)).toBe(11);
    expect(calculateLevel(10000)).toBe(15);
  });
});

describe('Daily Point Cap', () => {
  const DAILY_CAP = 100;

  function calculateAwardablePoints(
    basePoints: number,
    currentTodayPoints: number,
  ): number {
    const remaining = DAILY_CAP - currentTodayPoints;
    return Math.min(basePoints, Math.max(0, remaining));
  }

  it('awards full points when under cap', () => {
    expect(calculateAwardablePoints(10, 0)).toBe(10);
    expect(calculateAwardablePoints(10, 50)).toBe(10);
    expect(calculateAwardablePoints(10, 89)).toBe(10);
  });

  it('awards partial points when would exceed cap', () => {
    expect(calculateAwardablePoints(10, 95)).toBe(5);
    expect(calculateAwardablePoints(20, 85)).toBe(15);
  });

  it('awards 0 points when at cap', () => {
    expect(calculateAwardablePoints(10, 100)).toBe(0);
  });

  it('awards 0 points when over cap', () => {
    expect(calculateAwardablePoints(10, 105)).toBe(0);
  });
});

describe('Streak Bonus Multiplier', () => {
  const STREAK_BONUS_MULTIPLIER = 0.1;
  const MAX_MULTIPLIER = 2.0;
  const BASE_POINTS = 10;

  function calculatePointsWithBonus(streak: number): number {
    const multiplier = Math.min(
      1 + streak * STREAK_BONUS_MULTIPLIER,
      MAX_MULTIPLIER,
    );
    return Math.round(BASE_POINTS * multiplier);
  }

  it('no bonus at 0 streak', () => {
    expect(calculatePointsWithBonus(0)).toBe(10);
  });

  it('10% bonus at 1 day streak', () => {
    expect(calculatePointsWithBonus(1)).toBe(11);
  });

  it('50% bonus at 5 day streak', () => {
    expect(calculatePointsWithBonus(5)).toBe(15);
  });

  it('caps at 100% bonus (2x) at 10+ day streak', () => {
    expect(calculatePointsWithBonus(10)).toBe(20);
    expect(calculatePointsWithBonus(15)).toBe(20);
    expect(calculatePointsWithBonus(100)).toBe(20);
  });
});
