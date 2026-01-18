import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWeeklyReviewData } from '@/actions/reviews';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Repeat,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

interface ReviewPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function WeeklyReviewPage({
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
  const weekOffset = parseInt(params.week || '0', 10);

  const data = await getWeeklyReviewData(weekOffset, timezone);

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Unable to load review data
      </div>
    );
  }

  const weekStartDate = parseISO(data.weekStart);
  const weekEndDate = parseISO(data.weekEnd);

  return (
    <main className="flex-1 overflow-auto pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/reviews/weekly?week=${weekOffset + 1}`}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground">
                Weekly Review
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(weekStartDate, 'MMM d')} –{' '}
                {format(weekEndDate, 'MMM d, yyyy')}
              </p>
            </div>
            <Link
              href={
                weekOffset > 0 ? `/reviews/weekly?week=${weekOffset - 1}` : '#'
              }
              className={cn(
                'p-2 rounded-lg transition-colors',
                weekOffset > 0
                  ? 'hover:bg-muted'
                  : 'opacity-30 cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
          <Link
            href="/reviews/monthly"
            className="text-sm text-primary hover:underline"
          >
            View Monthly
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Tasks */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Tasks</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.tasksCompleted}
              <span className="text-sm font-normal text-muted-foreground">
                /{data.tasksTotal}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {data.taskCompletionRate}% complete
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
              <span className="text-sm font-normal text-muted-foreground">
                /{data.habitsTotal}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {data.habitCompletionRate}% complete
            </p>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flame className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Streak</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {data.currentStreak}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                days
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Current streak</p>
          </div>

          {/* Active Days */}
          <div className="p-4 rounded-xl bg-card border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Active</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.activeDays}
              <span className="text-sm font-normal text-muted-foreground">
                /7
              </span>
            </p>
            <p className="text-xs text-muted-foreground">Active days</p>
          </div>
        </div>

        {/* Finance Summary */}
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="text-muted-foreground">$</span> Finance Overview
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Income
              </p>
              <p className="text-lg font-semibold text-emerald-500">
                +${data.totalIncome.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Expense
              </p>
              <p className="text-lg font-semibold text-red-500">
                -${data.totalExpense.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Net
              </p>
              <p
                className={cn(
                  'text-lg font-semibold flex items-center justify-center gap-1',
                  data.netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {data.netFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                ${Math.abs(data.netFlow).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Top Categories */}
          {data.topCategories.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Top Expenses</p>
              <div className="flex flex-wrap gap-2">
                {data.topCategories.map((cat) => (
                  <span
                    key={cat.category}
                    className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground"
                  >
                    {cat.category}: ${cat.amount.toFixed(0)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Breakdown - Mini Heatmap Style */}
        <div className="p-4 rounded-xl bg-card border border-border/50 space-y-4">
          <h2 className="text-sm font-medium text-foreground">
            Daily Activity
          </h2>

          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="text-xs text-muted-foreground text-center"
              >
                {day}
              </div>
            ))}
            {data.dailyBreakdown.map((day) => {
              const total =
                day.tasksCompleted + day.habitsCompleted + day.transactions;
              return (
                <div
                  key={day.date}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                    total === 0
                      ? 'bg-muted/30 text-muted-foreground/50'
                      : total <= 2
                      ? 'bg-primary/20 text-primary'
                      : total <= 4
                      ? 'bg-primary/40 text-primary'
                      : 'bg-primary/60 text-white'
                  )}
                  title={`${day.tasksCompleted} tasks, ${day.habitsCompleted} habits, ${day.transactions} transactions`}
                >
                  {total > 0 ? total : '–'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calm Reflection Prompt */}
        <div className="p-4 rounded-xl bg-surface/50 border border-border/30 space-y-2">
          <p className="text-sm text-foreground font-medium">
            A moment to reflect
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.activeDays >= 5
              ? "You showed up consistently this week. That's what matters most—not perfection, but presence."
              : data.activeDays >= 3
              ? "Some days were quieter than others, and that's okay. Progress isn't always visible."
              : 'Every week is a fresh start. Be gentle with yourself as you build momentum.'}
          </p>
        </div>
      </div>
    </main>
  );
}
