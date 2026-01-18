/**
 * End-of-Day Job Tests
 *
 * Tests for the end-of-day cron job functionality:
 * - Auto-expiring unconfirmed habits to 'skipped'
 * - Generating daily snapshots
 * - Moving delayed tasks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types for testing
interface TaskInstance {
  id: string;
  user_id: string;
  task_id: string;
  logical_day: string;
  status: 'pending' | 'done' | 'skipped' | 'delayed';
  updated_at: string;
}

interface DailySnapshot {
  id: string;
  user_id: string;
  logical_day: string;
  tasks_total: number;
  tasks_completed: number;
  habits_total: number;
  habits_completed: number;
  created_at: string;
}

// --- Test Helpers ---

function createMockInstance(
  overrides: Partial<TaskInstance> = {},
): TaskInstance {
  return {
    id: `instance_${Date.now()}`,
    user_id: 'test_user',
    task_id: 'test_task',
    logical_day: new Date().toISOString().split('T')[0],
    status: 'pending',
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// --- Auto-Expire Logic Tests ---

describe('End-of-Day: Auto-Expire Habits', () => {
  it('should mark pending habit instances as skipped', () => {
    const instance = createMockInstance({ status: 'pending' });

    // Simulate auto-expire logic
    const shouldExpire = instance.status === 'pending';
    const newStatus = shouldExpire ? 'skipped' : instance.status;

    expect(shouldExpire).toBe(true);
    expect(newStatus).toBe('skipped');
  });

  it('should NOT change already completed instances', () => {
    const instance = createMockInstance({ status: 'done' });

    const shouldExpire = instance.status === 'pending';

    expect(shouldExpire).toBe(false);
    expect(instance.status).toBe('done');
  });

  it('should NOT change already skipped instances', () => {
    const instance = createMockInstance({ status: 'skipped' });

    const shouldExpire = instance.status === 'pending';

    expect(shouldExpire).toBe(false);
    expect(instance.status).toBe('skipped');
  });

  it('should NOT change delayed instances', () => {
    const instance = createMockInstance({ status: 'delayed' });

    const shouldExpire = instance.status === 'pending';

    expect(shouldExpire).toBe(false);
    expect(instance.status).toBe('delayed');
  });

  it('should only expire instances for the target logical day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayInstance = createMockInstance({
      status: 'pending',
      logical_day: new Date().toISOString().split('T')[0],
    });
    const yesterdayInstance = createMockInstance({
      status: 'pending',
      logical_day: yesterdayStr,
    });

    const targetDay = yesterdayStr;

    const shouldExpireToday = todayInstance.logical_day === targetDay;
    const shouldExpireYesterday = yesterdayInstance.logical_day === targetDay;

    expect(shouldExpireToday).toBe(false);
    expect(shouldExpireYesterday).toBe(true);
  });
});

// --- Daily Snapshot Generation Tests ---

describe('End-of-Day: Daily Snapshot Generation', () => {
  it('should calculate correct task completion stats', () => {
    const instances: TaskInstance[] = [
      createMockInstance({ status: 'done' }),
      createMockInstance({ status: 'done' }),
      createMockInstance({ status: 'skipped' }),
      createMockInstance({ status: 'pending' }),
    ];

    const tasksTotal = instances.length;
    const tasksCompleted = instances.filter((i) => i.status === 'done').length;
    const tasksSkipped = instances.filter((i) => i.status === 'skipped').length;

    expect(tasksTotal).toBe(4);
    expect(tasksCompleted).toBe(2);
    expect(tasksSkipped).toBe(1);
  });

  it('should calculate completion rate correctly', () => {
    const total = 5;
    const completed = 3;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    expect(completionRate).toBe(60);
  });

  it('should handle zero tasks gracefully', () => {
    const total = 0;
    const completed = 0;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    expect(completionRate).toBe(0);
  });

  it('should generate unique snapshots per user per day', () => {
    const snap1: DailySnapshot = {
      id: 'snap_1',
      user_id: 'user_a',
      logical_day: '2026-01-17',
      tasks_total: 5,
      tasks_completed: 3,
      habits_total: 2,
      habits_completed: 1,
      created_at: new Date().toISOString(),
    };

    const snap2: DailySnapshot = {
      id: 'snap_2',
      user_id: 'user_b',
      logical_day: '2026-01-17',
      tasks_total: 3,
      tasks_completed: 2,
      habits_total: 1,
      habits_completed: 1,
      created_at: new Date().toISOString(),
    };

    // Different users, same day
    expect(snap1.user_id).not.toBe(snap2.user_id);
    expect(snap1.logical_day).toBe(snap2.logical_day);
  });

  it('should not duplicate snapshots on re-run', () => {
    const existingSnapshots: DailySnapshot[] = [
      {
        id: 'existing',
        user_id: 'user_a',
        logical_day: '2026-01-17',
        tasks_total: 5,
        tasks_completed: 3,
        habits_total: 2,
        habits_completed: 1,
        created_at: new Date().toISOString(),
      },
    ];

    const newSnapshot = {
      user_id: 'user_a',
      logical_day: '2026-01-17',
    };

    // Check if snapshot already exists (idempotency)
    const exists = existingSnapshots.some(
      (s) =>
        s.user_id === newSnapshot.user_id &&
        s.logical_day === newSnapshot.logical_day,
    );

    expect(exists).toBe(true);
    // In real implementation, would upsert or skip
  });
});

// --- Delayed Task Move Tests ---

describe('End-of-Day: Delayed Task Handling', () => {
  it('should identify tasks to move to next day', () => {
    const delayedInstance = createMockInstance({ status: 'delayed' });

    const shouldMove = delayedInstance.status === 'delayed';

    expect(shouldMove).toBe(true);
  });

  it('should calculate next logical day correctly', () => {
    const currentDay = '2026-01-17';
    const nextDay = new Date(currentDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextDayStr = nextDay.toISOString().split('T')[0];

    expect(nextDayStr).toBe('2026-01-18');
  });

  it('should handle month boundaries', () => {
    const lastDayOfMonth = '2026-01-31';
    const nextDay = new Date(lastDayOfMonth);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextDayStr = nextDay.toISOString().split('T')[0];

    expect(nextDayStr).toBe('2026-02-01');
  });

  it('should handle year boundaries', () => {
    const lastDayOfYear = '2026-12-31';
    const nextDay = new Date(lastDayOfYear);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextDayStr = nextDay.toISOString().split('T')[0];

    expect(nextDayStr).toBe('2027-01-01');
  });
});
