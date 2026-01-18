/**
 * Lightweight RRULE implementation for recurring transactions
 * Supports common patterns without external dependencies
 */

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface RRuleConfig {
  freq: RecurringFrequency;
  interval?: number;
  bymonthday?: number; // Day of month (1-31)
  byday?: string; // Day of week (MO, TU, WE, TH, FR, SA, SU)
}

/**
 * Generate RRULE string from config
 */
export function generateRRule(config: RRuleConfig): string {
  const parts: string[] = [];

  // Frequency mapping
  const freqMap = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    biweekly: 'WEEKLY',
    monthly: 'MONTHLY',
    quarterly: 'MONTHLY',
    yearly: 'YEARLY',
  };

  parts.push(`FREQ=${freqMap[config.freq]}`);

  // Interval
  if (config.freq === 'biweekly') {
    parts.push('INTERVAL=2');
  } else if (config.freq === 'quarterly') {
    parts.push('INTERVAL=3');
  } else if (config.interval && config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }

  // Day of month
  if (config.bymonthday) {
    parts.push(`BYMONTHDAY=${config.bymonthday}`);
  }

  // Day of week
  if (config.byday) {
    parts.push(`BYDAY=${config.byday}`);
  }

  return parts.join(';');
}

/**
 * Parse RRULE string to config
 */
export function parseRRule(rrule: string): RRuleConfig {
  const parts = rrule.split(';');
  const config: Partial<RRuleConfig> = {};

  parts.forEach((part) => {
    const [key, value] = part.split('=');

    if (key === 'FREQ') {
      const freqMap: Record<string, RecurringFrequency> = {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
      };
      config.freq = freqMap[value] || 'monthly';
    } else if (key === 'INTERVAL') {
      config.interval = parseInt(value, 10);
    } else if (key === 'BYMONTHDAY') {
      config.bymonthday = parseInt(value, 10);
    } else if (key === 'BYDAY') {
      config.byday = value;
    }
  });

  return config as RRuleConfig;
}

/**
 * Calculate next occurrence from RRULE
 */
export function calculateNextOccurrence(rrule: string, after?: Date): Date {
  const config = parseRRule(rrule);
  const startDate = after || new Date();
  const next = new Date(startDate);

  // Move to next day to avoid same-day matches
  next.setDate(next.getDate() + 1);

  switch (config.freq) {
    case 'daily':
      // Already moved forward 1 day
      break;

    case 'weekly':
    case 'biweekly': {
      const interval = config.freq === 'biweekly' ? 14 : 7;
      next.setDate(next.getDate() + interval - 1);
      break;
    }

    case 'monthly':
    case 'quarterly': {
      const monthInterval = config.freq === 'quarterly' ? 3 : 1;
      next.setMonth(next.getMonth() + monthInterval);

      if (config.bymonthday) {
        next.setDate(config.bymonthday);
      }
      break;
    }

    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);

      if (config.bymonthday) {
        next.setDate(config.bymonthday);
      }
      break;
  }

  return next;
}

/**
 * Get next N occurrences for preview
 */
export function getNextOccurrences(
  rrule: string,
  count = 3,
  start?: Date,
): Date[] {
  const occurrences: Date[] = [];
  let current = start || new Date();

  for (let i = 0; i < count; i++) {
    current = calculateNextOccurrence(rrule, current);
    occurrences.push(new Date(current));
  }

  return occurrences;
}

/**
 * Quick presets for common recurring patterns
 */
export const RECURRING_PRESETS = {
  rent: {
    label: '🏠 Rent',
    freq: 'monthly' as RecurringFrequency,
    bymonthday: 1,
    type: 'expense' as const,
  },
  salary: {
    label: '💰 Salary',
    freq: 'biweekly' as RecurringFrequency,
    byday: 'FR',
    type: 'income' as const,
  },
  phone: {
    label: '📱 Phone Bill',
    freq: 'monthly' as RecurringFrequency,
    bymonthday: 15,
    type: 'expense' as const,
  },
  utilities: {
    label: '🔌 Utilities',
    freq: 'monthly' as RecurringFrequency,
    bymonthday: 20,
    type: 'expense' as const,
  },
  subscription: {
    label: '📺 Subscription',
    freq: 'monthly' as RecurringFrequency,
    bymonthday: 1,
    type: 'expense' as const,
  },
};
