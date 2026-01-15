'use client';

import { CheckCircle2, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsRow() {
  // Mock data for now
  const stats = [
    {
      label: 'Tasks Done',
      value: '0/5',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Spent Today',
      value: '$0.00',
      icon: Wallet,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Streak',
      value: '1 Day',
      icon: TrendingUp,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:bg-white/60"
          >
            <div className={cn('p-2 rounded-full mb-2', stat.bg)}>
              <Icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              {stat.value}
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
