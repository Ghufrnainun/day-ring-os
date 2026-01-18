/**
 * Advanced Analytics Module
 *
 * Provides correlation analysis between tasks, habits, and finance data.
 * Helps users discover patterns in their behavior.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// --- Types ---

export interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative' | 'none';
  dataPoints: number;
  insight?: string;
}

export interface DailyMetrics {
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  spending: number;
  income: number;
  productivityScore: number; // 0-100
}

export interface AnalyticsInsights {
  period: { start: string; end: string };
  correlations: CorrelationResult[];
  patterns: PatternInsight[];
  recommendations: string[];
}

export interface PatternInsight {
  type: 'peak_day' | 'low_day' | 'spending_trigger' | 'habit_pattern';
  description: string;
  confidence: number; // 0-100
  data: Record<string, unknown>;
}

// --- Calculations ---

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Interpret correlation strength
 */
function interpretCorrelation(r: number): {
  strength: CorrelationResult['strength'];
  direction: CorrelationResult['direction'];
} {
  const absR = Math.abs(r);
  let strength: CorrelationResult['strength'] = 'none';

  if (absR >= 0.7) strength = 'strong';
  else if (absR >= 0.4) strength = 'moderate';
  else if (absR >= 0.2) strength = 'weak';

  const direction: CorrelationResult['direction'] =
    r > 0.1 ? 'positive' : r < -0.1 ? 'negative' : 'none';

  return { strength, direction };
}

// --- Data Fetching ---

/**
 * Get daily metrics for a date range
 */
export async function getDailyMetrics(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DailyMetrics[]> {
  // Get all dates in range
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  const metrics: DailyMetrics[] = [];

  for (const date of dates) {
    // Task instances for this day
    const { data: tasks } = await supabase
      .from('task_instances')
      .select('status')
      .eq('user_id', userId)
      .eq('logical_day', date);

    // Transactions for this day
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .eq('logical_day', date);

    const tasksTotal = tasks?.length || 0;
    const tasksCompleted =
      tasks?.filter((t) => t.status === 'done').length || 0;

    // Separate habits (we'd need to join with repeat_rules, simplified here)
    const habitsTotal = tasksTotal;
    const habitsCompleted = tasksCompleted;

    const spending =
      transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const income =
      transactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const productivityScore =
      tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    metrics.push({
      date,
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      spending,
      income,
      productivityScore,
    });
  }

  return metrics;
}

// --- Correlation Analysis ---

/**
 * Analyze correlations between different metrics
 */
export function analyzeCorrelations(
  metrics: DailyMetrics[],
): CorrelationResult[] {
  if (metrics.length < 7) return []; // Need at least a week of data

  const results: CorrelationResult[] = [];

  // Extract arrays
  const productivity = metrics.map((m) => m.productivityScore);
  const spending = metrics.map((m) => m.spending);
  const habitsCompleted = metrics.map((m) => m.habitsCompleted);
  const income = metrics.map((m) => m.income);

  // Productivity vs Spending
  const prodSpend = pearsonCorrelation(productivity, spending);
  const prodSpendInterp = interpretCorrelation(prodSpend);
  results.push({
    metric1: 'productivity',
    metric2: 'spending',
    correlation: Math.round(prodSpend * 100) / 100,
    ...prodSpendInterp,
    dataPoints: metrics.length,
    insight:
      prodSpendInterp.strength !== 'none'
        ? prodSpend > 0
          ? 'You tend to spend more on productive days'
          : 'You tend to spend less on productive days'
        : undefined,
  });

  // Habits vs Income
  const habitIncome = pearsonCorrelation(habitsCompleted, income);
  const habitIncomeInterp = interpretCorrelation(habitIncome);
  results.push({
    metric1: 'habits_completed',
    metric2: 'income',
    correlation: Math.round(habitIncome * 100) / 100,
    ...habitIncomeInterp,
    dataPoints: metrics.length,
    insight:
      habitIncomeInterp.strength !== 'none'
        ? habitIncome > 0
          ? 'Completing habits correlates with higher income days'
          : "Habit completion doesn't seem linked to income"
        : undefined,
  });

  // Productivity vs Previous Day Spending (lagged)
  if (metrics.length > 1) {
    const prevDaySpending = spending.slice(0, -1);
    const nextDayProd = productivity.slice(1);
    const laggedCorr = pearsonCorrelation(prevDaySpending, nextDayProd);
    const laggedInterp = interpretCorrelation(laggedCorr);

    if (laggedInterp.strength !== 'none') {
      results.push({
        metric1: 'previous_day_spending',
        metric2: 'next_day_productivity',
        correlation: Math.round(laggedCorr * 100) / 100,
        ...laggedInterp,
        dataPoints: metrics.length - 1,
        insight:
          laggedCorr < -0.2
            ? 'Higher spending one day may lead to lower productivity the next'
            : undefined,
      });
    }
  }

  return results;
}

// --- Pattern Detection ---

/**
 * Detect patterns and generate insights
 */
export function detectPatterns(metrics: DailyMetrics[]): PatternInsight[] {
  const patterns: PatternInsight[] = [];

  if (metrics.length < 7) return patterns;

  // Find best and worst days of the week
  const dayOfWeekStats: Record<
    number,
    { productivity: number[]; spending: number[] }
  > = {};

  metrics.forEach((m) => {
    const dayOfWeek = new Date(`${m.date}T12:00:00`).getDay();
    if (!dayOfWeekStats[dayOfWeek]) {
      dayOfWeekStats[dayOfWeek] = { productivity: [], spending: [] };
    }
    dayOfWeekStats[dayOfWeek].productivity.push(m.productivityScore);
    dayOfWeekStats[dayOfWeek].spending.push(m.spending);
  });

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Best productivity day
  let bestDay = 0;
  let bestAvg = 0;
  Object.entries(dayOfWeekStats).forEach(([day, data]) => {
    const avg =
      data.productivity.reduce((a, b) => a + b, 0) / data.productivity.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = parseInt(day);
    }
  });

  if (bestAvg > 50) {
    patterns.push({
      type: 'peak_day',
      description: `${dayNames[bestDay]} is your most productive day (avg ${Math.round(bestAvg)}% completion)`,
      confidence: Math.min(90, 50 + metrics.length * 2),
      data: { dayOfWeek: bestDay, avgProductivity: bestAvg },
    });
  }

  // Spending patterns
  let highSpendDay = 0;
  let highSpendAvg = 0;
  Object.entries(dayOfWeekStats).forEach(([day, data]) => {
    const avg = data.spending.reduce((a, b) => a + b, 0) / data.spending.length;
    if (avg > highSpendAvg) {
      highSpendAvg = avg;
      highSpendDay = parseInt(day);
    }
  });

  if (highSpendAvg > 0) {
    patterns.push({
      type: 'spending_trigger',
      description: `${dayNames[highSpendDay]} tends to be your highest spending day`,
      confidence: Math.min(80, 40 + metrics.length * 2),
      data: { dayOfWeek: highSpendDay, avgSpending: highSpendAvg },
    });
  }

  // Streak detection
  let currentStreak = 0;
  let maxStreak = 0;
  metrics.forEach((m) => {
    if (m.productivityScore >= 80) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  if (maxStreak >= 3) {
    patterns.push({
      type: 'habit_pattern',
      description: `Your longest high-productivity streak was ${maxStreak} days`,
      confidence: 95,
      data: { streakLength: maxStreak },
    });
  }

  return patterns;
}

// --- Main Analysis Function ---

/**
 * Generate comprehensive analytics insights
 */
export async function generateAnalyticsInsights(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<AnalyticsInsights> {
  const metrics = await getDailyMetrics(supabase, userId, startDate, endDate);
  const correlations = analyzeCorrelations(metrics);
  const patterns = detectPatterns(metrics);

  // Generate recommendations based on insights
  const recommendations: string[] = [];

  // Based on correlations
  correlations.forEach((c) => {
    if (
      c.metric1 === 'productivity' &&
      c.metric2 === 'spending' &&
      c.correlation < -0.3
    ) {
      recommendations.push(
        'Consider budgeting on less productive days to maintain balance.',
      );
    }
  });

  // Based on patterns
  patterns.forEach((p) => {
    if (p.type === 'peak_day') {
      recommendations.push(
        `Schedule important tasks on ${p.description.split(' ')[0]} for best results.`,
      );
    }
    if (p.type === 'spending_trigger') {
      recommendations.push(
        `Be mindful of spending on ${p.description.split(' ')[0]}s.`,
      );
    }
  });

  // Default recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      'Keep building your data - more insights will appear as you use Orbit.',
    );
  }

  return {
    period: { start: startDate, end: endDate },
    correlations,
    patterns,
    recommendations,
  };
}
