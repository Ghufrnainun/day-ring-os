import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  ...props
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-200/50 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 w-full',
        className
      )}
      {...props}
    />
  );
}

export function LoadingCard() {
  return (
    <div className="p-6 space-y-4 rounded-xl border border-border bg-card">
      <LoadingSkeleton className="h-4 w-2/3" />
      <LoadingSkeleton className="h-32 w-full" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
