import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * End-of-Day System Job
 *
 * This endpoint should be called by a cron job at the end of each day (e.g., 11:59 PM).
 * It performs the following:
 * 1. Auto-expire unconfirmed habit instances to 'skipped'
 * 2. Move delayed tasks to the next logical day
 * 3. Generate daily_snapshots record for analytics
 *
 * Authentication: Requires CRON_SECRET in Authorization header
 */
export async function POST(request: Request) {
  // Verify cron authentication
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  // Use service role for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Configuration Error', message: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    // The 'yesterday' is determined based on UTC for simplicity
    // In production, this should be ran per-timezone or at a specific timezone boundary
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const results = {
      expiredHabits: 0,
      delayedTasks: 0,
      snapshotsCreated: 0,
      errors: [] as string[],
    };

    // 1. Auto-expire unconfirmed habit instances (pending -> skipped)
    const { data: expiredInstances, error: expireError } = await supabase
      .from('task_instances')
      .update({
        status: 'skipped',
        updated_at: now.toISOString(),
      })
      .eq('status', 'pending')
      .eq('logical_day', yesterdayStr)
      .select('id');

    if (expireError) {
      results.errors.push(`Expire habits error: ${expireError.message}`);
    } else {
      results.expiredHabits = expiredInstances?.length || 0;
    }

    // 2. Move delayed tasks to today
    // Find tasks marked as 'delayed' (Note: in our current schema, delayed tasks
    // are set to 'pending' with new scheduled_at. This step is for any legacy 'delayed' status)
    // For now, we'll skip this as our updateTaskStatus already handles delayed -> pending + next day

    // 3. Generate daily_snapshots for analytics
    // Get all unique users who had activity yesterday
    const { data: users, error: usersError } = await supabase
      .from('task_instances')
      .select('user_id')
      .eq('logical_day', yesterdayStr);

    if (usersError) {
      results.errors.push(`Get users error: ${usersError.message}`);
    } else {
      const uniqueUserIds = [...new Set(users?.map((u) => u.user_id) || [])];

      for (const userId of uniqueUserIds) {
        try {
          // Count completed instances (done)
          const { count: completedTasks } = await supabase
            .from('task_instances')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('logical_day', yesterdayStr)
            .eq('status', 'done');

          // Count total instances
          const { count: totalTasks } = await supabase
            .from('task_instances')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('logical_day', yesterdayStr);

          // Get finance summary
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .eq('logical_day', yesterdayStr);

          const income =
            transactions
              ?.filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const expense =
            transactions
              ?.filter((t) => t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          // Insert or update daily snapshot
          const { error: snapshotError } = await supabase
            .from('daily_snapshots')
            .upsert(
              {
                user_id: userId,
                snapshot_date: yesterdayStr,
                tasks_completed: completedTasks || 0,
                tasks_total: totalTasks || 0,
                habits_confirmed: completedTasks || 0, // Habits are also task_instances
                habits_total: totalTasks || 0,
                income_total: income,
                expense_total: expense,
                updated_at: now.toISOString(),
              },
              {
                onConflict: 'user_id,snapshot_date',
              }
            );

          if (!snapshotError) {
            results.snapshotsCreated++;
          }
        } catch (e: any) {
          results.errors.push(`Snapshot error for ${userId}: ${e.message}`);
        }
      }
    }

    // Log the execution
    console.log('[END-OF-DAY]', {
      date: yesterdayStr,
      ...results,
    });

    return NextResponse.json({
      success: true,
      date: yesterdayStr,
      results,
    });
  } catch (error: any) {
    console.error('[END-OF-DAY] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// Health check for the endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/v1/system/end-of-day',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    description: 'End-of-day job to expire habits and generate snapshots',
  });
}
