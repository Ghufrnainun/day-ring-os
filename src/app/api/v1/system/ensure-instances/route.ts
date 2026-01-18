import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureInstancesForRange } from '@/lib/logic/ensure-instances';

/**
 * Service-Role Ensure Instances Engine
 *
 * This endpoint generates task instances for repeating tasks across a date range.
 * It runs with service_role privileges and is restricted to:
 * - System cron jobs (via CRON_SECRET)
 * - Admin operations only
 *
 * This is NOT for regular user calls - users trigger instance creation
 * through their own authenticated actions via getTodayData/getCalendarData.
 *
 * Use Cases:
 * - Batch pre-generation for all users (end-of-day job)
 * - Recovery/backfill operations
 * - System maintenance
 */

export async function POST(request: Request) {
  // Verify cron authentication (service-role only)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' },
      { status: 401 },
    );
  }

  // Use service role for batch operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Configuration Error', message: 'Missing Supabase credentials' },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const body = await request.json();
    const {
      user_ids, // Optional: specific users to process (default: all active users)
      start_date, // Required: YYYY-MM-DD
      end_date, // Required: YYYY-MM-DD (max 30 days from start)
      dry_run = false, // If true, only return what would be created
    } = body;

    // Validate dates
    if (!start_date || !end_date) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'start_date and end_date are required',
        },
        { status: 400 },
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays > 30) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Date range cannot exceed 30 days',
        },
        { status: 400 },
      );
    }

    if (diffDays < 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'end_date must be after start_date',
        },
        { status: 400 },
      );
    }

    const results = {
      processed_users: 0,
      created_instances: 0,
      errors: [] as string[],
      dry_run,
    };

    // Get users to process
    let usersToProcess: { user_id: string; timezone: string }[] = [];

    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      // Specific users provided
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, timezone')
        .in('user_id', user_ids);

      if (error) {
        return NextResponse.json(
          { error: 'Database Error', message: error.message },
          { status: 500 },
        );
      }
      usersToProcess = profiles || [];
    } else {
      // All active users (users with repeat_rules)
      const { data: activeUsers, error } = await supabase
        .from('repeat_rules')
        .select('user_id')
        .limit(1000);

      if (error) {
        return NextResponse.json(
          { error: 'Database Error', message: error.message },
          { status: 500 },
        );
      }

      // Get unique user IDs
      const uniqueUserIds = [
        ...new Set(activeUsers?.map((u) => u.user_id) || []),
      ];

      // Fetch their timezones
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, timezone')
        .in('user_id', uniqueUserIds);

      usersToProcess = profiles || [];
    }

    if (dry_run) {
      return NextResponse.json({
        success: true,
        dry_run: true,
        would_process: {
          users: usersToProcess.length,
          date_range: { start_date, end_date, days: diffDays + 1 },
        },
      });
    }

    // Process each user
    for (const user of usersToProcess) {
      try {
        // Call ensureInstancesForRange for this user
        await ensureInstancesForRange(
          supabase,
          user.user_id,
          start_date,
          end_date,
          user.timezone || 'UTC',
        );

        results.processed_users++;
      } catch (e: any) {
        results.errors.push(`User ${user.user_id}: ${e.message}`);
      }
    }

    // Log execution
    console.log('[ENSURE-INSTANCES]', {
      start_date,
      end_date,
      ...results,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[ENSURE-INSTANCES] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

// Health check for the endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/v1/system/ensure-instances',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    description:
      'Batch generate task instances for date range (service-role only)',
    parameters: {
      user_ids: 'optional array of user IDs (default: all active users)',
      start_date: 'required YYYY-MM-DD',
      end_date: 'required YYYY-MM-DD (max 30 days from start)',
      dry_run: 'optional boolean (default: false)',
    },
  });
}
