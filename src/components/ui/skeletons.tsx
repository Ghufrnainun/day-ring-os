import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Task item skeleton
export function TaskSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/40">
      <Skeleton className="w-6 h-6 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

// Task list skeleton
export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card/40 p-4 space-y-3',
        className
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Finance transaction skeleton
export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/30">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

// Note card skeleton
export function NoteSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-2">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function NoteListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <NoteSkeleton key={i} />
      ))}
    </div>
  );
}

// Calendar day skeleton
export function CalendarDaySkeleton() {
  return (
    <div className="p-3 rounded-xl border border-border/30 bg-card/30 min-h-[120px] space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export function WeeklyCalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <CalendarDaySkeleton key={i} />
      ))}
    </div>
  );
}

// Focus card skeleton
export function FocusCardSkeleton() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Today page skeleton
export function TodayPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-6 pb-24 sm:pb-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <FocusCardSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <TaskListSkeleton count={4} />
      </div>
    </div>
  );
}

// Finance page skeleton
export function FinancePageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TransactionListSkeleton count={6} />
    </div>
  );
}

// Notes page skeleton
export function NotesPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <NoteListSkeleton count={6} />
    </div>
  );
}
