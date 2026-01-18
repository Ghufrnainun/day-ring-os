import { SupabaseClient } from '@supabase/supabase-js';

// Helper: Get array of date strings in YYYY-MM-DD format between start and end (inclusive)
function getDaysInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);

  // Safety break to prevent infinite loops if bad input
  let count = 0;
  while (current <= last && count < 366) {
    // Limit to a year block
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
}

// Helper to get day of week (0-6) from a date string, assuming YYYY-MM-DD is local logic
function getDayOfWeek(dateString: string): number {
  // Constructing date with time to avoid UTC shift issues if run in different timezones server-side
  // We treat YYYY-MM-DD as the "absolute" date.
  const d = new Date(`${dateString}T12:00:00`);
  return d.getDay();
}

/**
 * Ensures task instances exist for the given date range.
 * Efficiently handles bulk checks and inserts.
 */
export async function ensureInstancesForRange(
  supabase: SupabaseClient,
  userId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
  timezone: string
) {
  // 1. Fetch active repeat rules
  const { data: rules, error } = await supabase
    .from('repeat_rules')
    .select(
      `
      id,
      task_id,
      rule_type,
      rule_config,
      tasks!inner (
        id,
        deleted_at,
        created_at
      )
    `
    )
    .eq('user_id', userId)
    .is('tasks.deleted_at', null);

  if (error || !rules || rules.length === 0) {
    if (error) console.error('Error fetching rules:', error);
    return;
  }

  // 2. Fetch ALL existing instances in this range
  // We only care about instances linked to these active rules
  const ruleTaskIds = rules.map((r) => r.task_id);

  const { data: existingInstances, error: fetchError } = await supabase
    .from('task_instances')
    .select('task_id, logical_day')
    .eq('user_id', userId)
    .gte('logical_day', startDate)
    .lte('logical_day', endDate)
    .in('task_id', ruleTaskIds);

  if (fetchError) {
    console.error('Error fetching existing instances:', fetchError);
    return;
  }

  // Create a quick lookup Set: "taskId|date"
  const existingSet = new Set(
    existingInstances?.map((i) => `${i.task_id}|${i.logical_day}`) || []
  );

  const daysToCheck = getDaysInRange(startDate, endDate);
  const newInstances: any[] = [];

  // 3. Iterate Days & Rules to find gaps
  for (const date of daysToCheck) {
    const dayOfWeek = getDayOfWeek(date);

    for (const rule of rules) {
      let shouldExist = false;

      if (rule.rule_type === 'daily') {
        shouldExist = true;
      } else if (rule.rule_type === 'weekly') {
        // MVP: Match creation day of week
        // NOTE: If we implement custom days later, check rule_config.days here
        const taskData = rule.tasks as unknown as
          | { created_at: string }
          | undefined;
        const taskCreatedAt = taskData?.created_at;
        if (!taskCreatedAt) {
          continue;
        }

        const createdDay = getDayOfWeek(
          new Date(taskCreatedAt).toISOString().split('T')[0]
        );
        if (createdDay === dayOfWeek) {
          shouldExist = true;
        }
      }

      if (shouldExist) {
        const key = `${rule.task_id}|${date}`;
        if (!existingSet.has(key)) {
          newInstances.push({
            user_id: userId,
            task_id: rule.task_id,
            logical_day: date,
            status: 'pending',
          });
        }
      }
    }
  }

  // 4. Bulk Insert
  if (newInstances.length > 0) {
    // Chunking if necessary? Supabase handles reasonable batch sizes (thousands).
    // For a month * 10 habits = 300 rows, fine.
    const { error: insertError } = await supabase
      .from('task_instances')
      .insert(newInstances);

    if (insertError) {
      console.error('Error inserting instances:', insertError);
    }
  }
}

/**
 * Wrapper for single day to maintain backward compatibility
 */
export async function ensureInstancesForDay(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  timezone: string
) {
  return ensureInstancesForRange(supabase, userId, date, date, timezone);
}
