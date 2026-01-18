'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  data: Record<string, number>; // { "2024-01-01": 5, ... }
  className?: string;
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  // Generate last 365 days
  const days: Array<{ date: string; count: number; dayOfWeek: number }> = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: data[dateStr] || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by weeks
  const weeks: Array<Array<(typeof days)[0]>> = [];
  let currentWeek: typeof days = [];

  // Pad first week if doesn't start on Sunday
  const firstDayOfWeek = days[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0, dayOfWeek: i });
  }

  days.forEach((day) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      // Saturday
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Color intensity based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count <= 2) return 'bg-emerald-200';
    if (count <= 5) return 'bg-emerald-400';
    if (count <= 10) return 'bg-emerald-600';
    return 'bg-emerald-700';
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="inline-flex gap-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  'w-3 h-3 rounded-sm',
                  day.date ? getColor(day.count) : 'bg-transparent',
                )}
                title={day.date ? `${day.date}: ${day.count} activities` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
