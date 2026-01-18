'use client';

import { cn } from '@/lib/utils';

interface DensityIndicatorProps {
  count: number;
  completed?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

/**
 * Density indicator for calendar views
 * Shows task density as dots or count based on quantity
 */
export function DensityIndicator({
  count,
  completed = 0,
  max = 5,
  size = 'sm',
  showCount = false,
  className,
}: DensityIndicatorProps) {
  if (count === 0) return null;

  const displayAsDots = count <= max && !showCount;
  const allCompleted = count > 0 && completed === count;

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (displayAsDots) {
    return (
      <div className={cn('flex items-center gap-0.5', className)}>
        {Array.from({ length: Math.min(count, max) }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-full transition-colors',
              sizeClasses[size],
              i < completed ? 'bg-green-500' : 'bg-primary/40'
            )}
          />
        ))}
      </div>
    );
  }

  // Show count badge for larger numbers
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center text-[10px] font-medium rounded-full px-1.5 py-0.5',
        allCompleted
          ? 'bg-green-500/20 text-green-700'
          : 'bg-primary/10 text-primary',
        className
      )}
    >
      {completed > 0 ? `${completed}/${count}` : count}
    </span>
  );
}

/**
 * Compact density dots for minimal UI
 */
export function DensityDots({
  count,
  color = 'default',
  className,
}: {
  count: number;
  color?: 'default' | 'success' | 'warning' | 'muted';
  className?: string;
}) {
  if (count === 0) return null;

  const colorClasses = {
    default: 'bg-primary/50',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    muted: 'bg-muted-foreground/30',
  };

  const displayCount = Math.min(count, 5);

  return (
    <div className={cn('flex items-center gap-[2px]', className)}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <span
          key={i}
          className={cn('w-1 h-1 rounded-full', colorClasses[color])}
        />
      ))}
      {count > 5 && (
        <span className="text-[8px] text-muted-foreground ml-0.5">+</span>
      )}
    </div>
  );
}

/**
 * Progress bar for day completion
 */
export function DayProgress({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;

  const percentage = Math.round((completed / total) * 100);
  const isComplete = percentage === 100;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isComplete ? 'bg-green-500' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
