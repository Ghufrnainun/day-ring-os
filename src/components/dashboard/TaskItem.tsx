'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  title: string;
  time?: string;
  completed?: boolean;
  onClick?: () => void;
}

export function TaskItem({
  title,
  time,
  completed = false,
  onClick,
}: TaskItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center p-3 rounded-xl border transition-all duration-200 group cursor-pointer',
        completed
          ? 'bg-muted/5 border-transparent opacity-60'
          : 'bg-card border-border/50 hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors',
          completed
            ? 'bg-primary border-primary'
            : 'border-muted group-hover:border-primary'
        )}
      >
        {completed && <Check size={12} className="text-primary-foreground" />}
      </div>
      <div className="flex-1">
        <div
          className={cn(
            'text-sm font-medium',
            completed && 'line-through text-muted-foreground'
          )}
        >
          {title}
        </div>
        {time && <div className="text-xs text-muted-foreground">{time}</div>}
      </div>
    </div>
  );
}
