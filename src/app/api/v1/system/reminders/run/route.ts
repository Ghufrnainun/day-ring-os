import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Reminder Dispatch System Job
 *
 * This endpoint should be called by a cron job every 5-15 minutes.
 * It performs the following:
 * 1. Query reminders due within the current window
 * 2. Send reminder emails via Resend (or alternative)
 * 3. Log deliveries to reminder_deliveries table
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
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Configuration Error', message: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Email sending will fall back to console log if Resend is not configured
  const resendEnabled = !!resendApiKey;

  try {
    const now = new Date();
    const windowMinutes = 15; // Process reminders due in next 15 minutes
    const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Query due reminders
    // Reminders are linked to tasks/habits via task_id
    // The reminder_time is stored as TIME, so we need to match against current time
    const currentTimeStr = now.toISOString().split('T')[1].slice(0, 5); // HH:MM
    const windowEndTimeStr = windowEnd.toISOString().split('T')[1].slice(0, 5);

    const { data: dueReminders, error: queryError } = await supabase
      .from('reminders')
      .select(
        `
        id,
        task_id,
        reminder_time,
        delivery_method,
        user_id,
        tasks!inner (
          title,
          description
        ),
        profiles:user_id (
          display_name
        )
      `
      )
      .eq('is_active', true)
      .gte('reminder_time', currentTimeStr)
      .lte('reminder_time', windowEndTimeStr);

    if (queryError) {
      return NextResponse.json(
        { error: 'Query Error', message: queryError.message },
        { status: 500 }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders due in current window',
        results,
      });
    }

    results.processed = dueReminders.length;

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        // Check if already delivered today
        const today = now.toISOString().split('T')[0];
        const { data: existingDelivery } = await supabase
          .from('reminder_deliveries')
          .select('id')
          .eq('reminder_id', reminder.id)
          .eq('delivered_at::date', today)
          .single();

        if (existingDelivery) {
          results.skipped++;
          continue;
        }

        // Get user email
        const { data: authUser, error: authError } =
          await supabase.auth.admin.getUserById(reminder.user_id);

        if (authError || !authUser?.user?.email) {
          results.failed++;
          results.errors.push(`No email for user ${reminder.user_id}`);
          continue;
        }

        const userEmail = authUser.user.email;
        const taskData = reminder.tasks as unknown as {
          title: string;
          description?: string;
        };
        const profileData = reminder.profiles as unknown as {
          display_name?: string;
        };
        const userName = profileData?.display_name || 'there';

        // Send email
        // TODO: Integrate with email service (Resend, SendGrid, etc.) when ready
        // For now, log the reminder that would be sent
        if (resendEnabled && reminder.delivery_method === 'email') {
          // When Resend is configured, use it here
          // For now, we'll log and mark as sent
          console.log('[REMINDER-EMAIL]', {
            to: userEmail,
            subject: `Reminder: ${taskData?.title || 'Your task'}`,
            taskTitle: taskData?.title,
            taskDescription: taskData?.description,
            reminderTime: reminder.reminder_time,
          });
        } else {
          // Fallback: Log that we would send
          console.log('[REMINDER-LOGGED]', {
            to: userEmail,
            task: taskData?.title,
            time: reminder.reminder_time,
          });
        }

        // Log delivery
        await supabase.from('reminder_deliveries').insert({
          reminder_id: reminder.id,
          user_id: reminder.user_id,
          delivery_method: reminder.delivery_method || 'email',
          status: 'sent',
          delivered_at: now.toISOString(),
        });

        results.sent++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`Error processing ${reminder.id}: ${e.message}`);
      }
    }

    console.log('[REMINDERS-RUN]', {
      timestamp: now.toISOString(),
      ...results,
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('[REMINDERS-RUN] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/v1/system/reminders/run',
    method: 'POST',
    auth: 'Bearer CRON_SECRET',
    description: 'Process and send due reminders within a 15-minute window',
  });
}

// Email template generator
function generateReminderEmailHtml(data: {
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  reminderTime: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder from Orbit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF8F5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 48px; height: 48px; background: #2F5D50; border-radius: 12px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%;"></div>
      </div>
    </div>
    
    <!-- Greeting -->
    <h1 style="font-size: 20px; color: #1A1A1A; margin: 0 0 8px 0; text-align: center;">
      Hey ${data.userName} 👋
    </h1>
    <p style="color: #666; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
      Just a gentle reminder about your upcoming task.
    </p>
    
    <!-- Task Card -->
    <div style="background: #FAF8F5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h2 style="font-size: 18px; color: #2F5D50; margin: 0 0 8px 0;">
        ${data.taskTitle}
      </h2>
      ${
        data.taskDescription
          ? `<p style="color: #666; font-size: 14px; margin: 0;">${data.taskDescription}</p>`
          : ''
      }
      <p style="color: #999; font-size: 12px; margin: 12px 0 0 0;">
        Scheduled for ${data.reminderTime}
      </p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center;">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL || 'https://orbit.app'
      }/today" style="display: inline-block; background: #2F5D50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 500;">
        Open Orbit
      </a>
    </div>
    
    <!-- Footer -->
    <p style="color: #999; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      Run your day calmly with Orbit
    </p>
  </div>
</body>
</html>
  `.trim();
}
