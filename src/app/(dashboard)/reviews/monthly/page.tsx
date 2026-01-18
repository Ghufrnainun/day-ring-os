import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMonthlyReviewData } from '@/actions/reviews';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Repeat,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, parseISO, getDay } from 'date-fns';

export const dynamic = 'force-dynamic';

interface ReviewPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MonthlyReviewPage({
  searchParams,
}: ReviewPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .single();

  const timezone = profile?.timezone || 'UTC';
  const params = await searchParams;
  const monthOffset = parseInt(params.month || '0', 10);

  const data = await getMonthlyReviewData(monthOffset, timezone);

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Unable to load review data
      </div>
    );
  }

  // Calculate padding for first day of month (for heatmap alignment)
  const firstDayOffset = getDay(parseISO(data.monthStart));
  const adjustedOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1;

  return (
    <main className="flex-1 overflow-auto pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/reviews/monthly?month=${monthOffset + 1}`}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground">
                Monthly Review
              </h1>
              <p className="text-sm text-muted-foreground">{data.monthLabel}</p>
            </div>
            <Link
              href={
                monthOffset > 0
                  ? `/reviews/monthly?month=${monthOffset - 1}`
                  : '#'
              }
              className={cn(
                'p-2 rounded-lg transition-colors',
                monthOffset > 0
                  ? 'hover:bg-muted'
                  : 'opacity-30 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
          <Link
            href="/reviews/weekly"
            className="text-sm text-primary hover:underline"
          >
            View Weekly
          </Link>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Tasks */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Tasks</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.tasksCompleted}
            </p>
            <p className="text-xs text-muted-foreground">
              of {data.tasksTotal} completed
            </p>
          </div>

          {/* Habits */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Repeat className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Habits</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.habitsCompleted}
            </p>
            <p className="text-xs text-muted-foreground">
              of {data.habitsTotal} completed
            </p>
          </div>

          {/* Income */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Income</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              ${data.totalIncome.toFixed(0)}
            </p>
          </div>

          {/* Expense */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-red-500">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Expense</span>
            </div>
            <p className="text-2xl font-bold text-red-500">
              ${data.totalExpense.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Heatmap */}
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Activity Heatmap
          </h2>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="text-xs text-muted-foreground text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for padding */}
            {Array.from({ length: adjustedOffset }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}

            {/* Activity cells */}
            {data.heatmapData.map((day) => {
              const intensity = Math.min(day.count, 8);
              return (
                <div
                  key={day.date}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-[10px] transition-all cursor-default',
                    intensity === 0
                      ? 'bg-muted/20'
                      : intensity <= 2
                      ? 'bg-primary/20'
                      : intensity <= 4
                      ? 'bg-primary/40'
                      : intensity <= 6
                      ? 'bg-primary/60'
                      : 'bg-primary/80'
                  )}
                  title={`${format(parseISO(day.date), 'MMM d')}: ${
                    day.count
                  } actions`}
                >
                  <span
                    className={cn(
                      'font-medium',
                      intensity > 4 ? 'text-white' : 'text-muted-foreground'
                    )}
                  >
                    {format(parseISO(day.date), 'd')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {[0, 2, 4, 6, 8].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-3 h-3 rounded',
                  level === 0
                    ? 'bg-muted/20'
                    : level === 2
                    ? 'bg-primary/20'
                    : level === 4
                    ? 'bg-primary/40'
                    : level === 6
                    ? 'bg-primary/60'
                    : 'bg-primary/80'
                )}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Weekly Summary
          </h2>

          <div className="space-y-2">
            {data.weeklyBreakdown.map((week) => (
              <div
                key={week.weekLabel}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {week.weekLabel}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-foreground">
                    {week.tasksCompleted} tasks
                  </span>
                  <span className="text-foreground">
                    {week.habitsCompleted} habits
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      week.netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {week.netFlow >= 0 ? '+' : ''}${week.netFlow.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Expense Categories */}
        {data.topCategories.length > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
            <h2 className="text-sm font-medium text-foreground">
              Top Expense Categories
            </h2>

            <div className="space-y-2">
              {data.topCategories.map((cat, index) => {
                const maxAmount = data.topCategories[0].amount;
                const percentage = (cat.amount / maxAmount) * 100;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {cat.category}
                      </span>
                      <span className="text-foreground font-medium">
                        ${cat.amount.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/50 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calm Reflection */}
        <div className="p-4 rounded-xl bg-surface/50 border border-border/30 space-y-2">
          <p className="text-sm text-foreground font-medium">
            Month in perspective
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.tasksCompleted + data.habitsCompleted > 50
              ? "You've been consistently showing up. Remember: sustainable progress beats bursts of intensity."
              : data.tasksCompleted + data.habitsCompleted > 20
              ? "Every action counts. You're building habits that compound over time."
              : 'Some months are about planting seeds. Others are about harvesting. Both matter.'}
          </p>
        </div>
      </div>
    </main>
  );
}
