'use client';

import { cn } from '@/lib/utils';
import {
  Inbox,
  CalendarOff,
  Wallet,
  NotebookPen,
  Sparkles,
} from 'lucide-react';

interface EmptyStateProps {
  type: 'tasks' | 'habits' | 'finance' | 'notes' | 'calendar' | 'general';
  title?: string;
  description?: string;
  className?: string;
}

const emptyStateConfig = {
  tasks: {
    icon: Inbox,
    title: 'Nothing on your plate',
    description: "Your day is clear. Add a task when you're ready.",
    color: 'text-primary/60',
  },
  habits: {
    icon: Sparkles,
    title: 'No habits yet',
    description: 'Small steps, big changes. Start with one habit.',
    color: 'text-purple-500/60',
  },
  finance: {
    icon: Wallet,
    title: 'No transactions',
    description: 'Your finances are peaceful. Log when something moves.',
    color: 'text-emerald-500/60',
  },
  notes: {
    icon: NotebookPen,
    title: 'A blank canvas',
    description: 'Capture a thought when inspiration strikes.',
    color: 'text-orange-500/60',
  },
  calendar: {
    icon: CalendarOff,
    title: 'Nothing scheduled',
    description: "An open day awaits. Plan when you're ready.",
    color: 'text-blue-500/60',
  },
  general: {
    icon: Inbox,
    title: 'Nothing here yet',
    description: "Take your time. There's no rush.",
    color: 'text-muted-foreground',
  },
};

export function EmptyState({
  type,
  title,
  description,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6',
        'text-center animate-fade-in',
        className
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          'bg-muted/30 border border-border/50'
        )}
      >
        <Icon className={cn('w-7 h-7', config.color)} />
      </div>
      <h3 className="text-lg font-medium text-foreground/80 mb-1">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-[240px]">
        {description || config.description}
      </p>
    </div>
  );
}

// Compact version for inline use
export function EmptyStateCompact({
  message = 'Nothing here yet',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center py-8 px-4',
        'text-center text-sm text-muted-foreground/60',
        className
      )}
    >
      <span>{message}</span>
    </div>
  );
}
