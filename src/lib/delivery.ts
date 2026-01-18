/**
 * Reminder Delivery Service
 *
 * Handles email delivery with retry logic and delivery logging.
 * Best-effort delivery: reminders are not alarm-grade, failures are logged.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'retry';

export interface DeliveryResult {
  status: DeliveryStatus;
  reminderId: string;
  userId: string;
  emailId?: string;
  error?: string;
  retryCount: number;
}

export interface DeliveryConfig {
  maxRetries: number;
  retryDelayMs: number;
  resendEnabled: boolean;
  resendApiKey?: string;
}

const DEFAULT_CONFIG: DeliveryConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  resendEnabled: false,
};

/**
 * Log delivery attempt to reminder_deliveries table
 */
export async function logDelivery(
  supabase: SupabaseClient,
  delivery: {
    userId: string;
    reminderId: string;
    status: DeliveryStatus;
    channel: 'email' | 'push' | 'sms';
    externalId?: string;
    errorMessage?: string;
    retryCount?: number;
  },
): Promise<void> {
  const { error } = await supabase.from('reminder_deliveries').insert({
    user_id: delivery.userId,
    reminder_id: delivery.reminderId,
    status: delivery.status,
    channel: delivery.channel,
    external_id: delivery.externalId,
    error_message: delivery.errorMessage,
    retry_count: delivery.retryCount || 0,
    delivered_at: delivery.status === 'sent' ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[DELIVERY] Failed to log delivery:', error.message);
  }
}

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(
  email: {
    to: string;
    subject: string;
    html: string;
  },
  config: DeliveryConfig,
  attempt: number = 1,
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!config.resendEnabled || !config.resendApiKey) {
    // Fallback to console logging when Resend is not configured
    console.log('[DELIVERY] Email would be sent:', {
      to: email.to,
      subject: email.subject,
      preview: email.html.substring(0, 100) + '...',
    });
    return { success: true, emailId: `mock_${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Orbit <noreply@orbit.app>',
        to: [email.to],
        subject: email.subject,
        html: email.html,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, emailId: data.id };
    }

    // Handle rate limiting with retry
    if (response.status === 429 && attempt < config.maxRetries) {
      await delay(config.retryDelayMs * attempt);
      return sendEmailWithRetry(email, config, attempt + 1);
    }

    const errorText = await response.text();
    return { success: false, error: `HTTP ${response.status}: ${errorText}` };
  } catch (error: any) {
    // Network errors - retry
    if (attempt < config.maxRetries) {
      await delay(config.retryDelayMs * attempt);
      return sendEmailWithRetry(email, config, attempt + 1);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process and deliver a reminder
 */
export async function deliverReminder(
  supabase: SupabaseClient,
  reminder: {
    id: string;
    userId: string;
    userEmail: string;
    taskTitle: string;
    reminderTime: string;
  },
  config: Partial<DeliveryConfig> = {},
): Promise<DeliveryResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const emailContent = {
    to: reminder.userEmail,
    subject: `⏰ Reminder: ${reminder.taskTitle}`,
    html: generateReminderEmail(reminder.taskTitle, reminder.reminderTime),
  };

  const { success, emailId, error } = await sendEmailWithRetry(
    emailContent,
    fullConfig,
  );

  const result: DeliveryResult = {
    status: success ? 'sent' : 'failed',
    reminderId: reminder.id,
    userId: reminder.userId,
    emailId,
    error,
    retryCount: 0, // Already retried internally
  };

  // Log the delivery
  await logDelivery(supabase, {
    userId: reminder.userId,
    reminderId: reminder.id,
    status: result.status,
    channel: 'email',
    externalId: emailId,
    errorMessage: error,
  });

  return result;
}

/**
 * Generate reminder email HTML
 */
function generateReminderEmail(taskTitle: string, time: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F6F1E8; margin: 0; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 48px; height: 48px; background: #2F4F4F; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 24px;">⏰</span>
      </div>
    </div>
    
    <h1 style="color: #2F4F4F; font-size: 20px; text-align: center; margin: 0 0 8px;">
      Gentle Reminder
    </h1>
    
    <p style="color: #6B7280; text-align: center; margin: 0 0 24px; font-size: 14px;">
      ${time}
    </p>
    
    <div style="background: #F9FAFB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #374151; font-size: 16px; margin: 0; text-align: center; font-weight: 500;">
        ${taskTitle}
      </p>
    </div>
    
    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
      This is a friendly reminder from Orbit. No pressure.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Batch process pending deliveries (for retry queue)
 */
export async function processRetryQueue(
  supabase: SupabaseClient,
  config: Partial<DeliveryConfig> = {},
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  // Get failed deliveries that can be retried
  const { data: pendingRetries, error } = await supabase
    .from('reminder_deliveries')
    .select(
      `
      id,
      user_id,
      reminder_id,
      retry_count,
      reminders!inner (
        id,
        profiles!inner (
          email
        ),
        tasks!inner (
          title
        ),
        remind_at
      )
    `,
    )
    .eq('status', 'failed')
    .lt('retry_count', config.maxRetries || 3)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !pendingRetries) {
    console.error('[RETRY] Failed to fetch retry queue:', error?.message);
    return results;
  }

  for (const retry of pendingRetries) {
    results.processed++;

    // Type assertion for nested data
    const reminderData = retry.reminders as any;

    const result = await deliverReminder(
      supabase,
      {
        id: retry.reminder_id,
        userId: retry.user_id,
        userEmail: reminderData.profiles.email,
        taskTitle: reminderData.tasks.title,
        reminderTime: reminderData.remind_at,
      },
      config,
    );

    if (result.status === 'sent') {
      results.succeeded++;
    } else {
      results.failed++;
    }

    // Update retry count
    await supabase
      .from('reminder_deliveries')
      .update({ retry_count: (retry.retry_count || 0) + 1 })
      .eq('id', retry.id);
  }

  return results;
}
