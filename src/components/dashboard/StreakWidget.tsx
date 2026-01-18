'use client';

import { Flame, Check, Minus, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakData } from '@/actions/streak';
import { format, parseISO } from 'date-fns';

interface StreakWidgetProps {
  data: StreakData;
}

export function StreakWidget({ data }: StreakWidgetProps) {
  const { currentStreak, longestStreak, todayComplete, weekProgress } = data;

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/40 border border-amber-200/30 p-4 shadow-lg shadow-amber-100/50 backdrop-blur-sm overflow-hidden group hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300">
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Flame Icon with Animation */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm',
              currentStreak > 0
                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                : 'bg-stone-200',
            )}
          >
            <Flame
              className={cn(
                'w-6 h-6',
                currentStreak > 0
                  ? 'text-white animate-pulse'
                  : 'text-stone-400',
              )}
            />
          </div>

          <div>
            <p className="text-2xl font-bold font-display">
              {currentStreak}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                day streak
              </span>
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Best: {longestStreak} days
              </p>
            )}
          </div>
        </div>

        {/* Today Status */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium',
            todayComplete
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700',
          )}
        >
          {todayComplete ? '✓ Today done!' : 'Keep going!'}
        </div>
      </div>

      {/* Week Progress */}
      <div className="flex items-center justify-between gap-1">
        {weekProgress.map((day, i) => {
          const dayLabel = format(parseISO(day.date), 'EEE').slice(0, 1);
          const isToday = i === weekProgress.length - 1;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all',
                  day.completed
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : day.total > 0
                      ? 'bg-stone-200 text-stone-500'
                      : 'bg-stone-100 text-stone-300',
                  isToday && 'ring-2 ring-primary ring-offset-1',
                )}
              >
                {day.completed ? (
                  <Check className="w-4 h-4" />
                ) : day.total > 0 ? (
                  <span>
                    {day.done}/{day.total}
                  </span>
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px]',
                  isToday
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
