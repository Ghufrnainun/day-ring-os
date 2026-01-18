'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Check, MoreHorizontal, SkipForward, Clock, Undo2 } from 'lucide-react';
import {
  updateTaskStatus,
  updateHabitStatus,
  undoTaskStatus,
  type TaskStatus,
} from '@/actions/update-task-status';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';

interface TimelineProps {
  items: Array<{
    id: string;
    type: 'task' | 'habit';
    title: string;
    status?: string;
    completed?: boolean;
    time?: string | null;
    original: any;
  }>;
  dateString: string;
}

export function Timeline({ items, dateString }: TimelineProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        type="tasks"
        className="rounded-2xl bg-surface/30 border border-border/50 border-dashed"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground px-1">Agenda</h2>
      <div className="relative space-y-3">
        {items.map((item) => (
          <TimelineItem
            key={`${item.type}-${item.id}`}
            item={item}
            dateString={dateString}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ item, dateString }: { item: any; dateString: string }) {
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{
    id: string;
    previousStatus: TaskStatus;
    toastId: string | number;
  } | null>(null);

  // Use optimistic status if set, otherwise use the actual status
  const currentStatus = optimisticStatus || item.status;
  const isCompleted =
    item.type === 'task'
      ? currentStatus === 'completed'
      : optimisticStatus === 'done' || (!optimisticStatus && item.completed);

  const isSkipped = currentStatus === 'skipped';

  const handleStatusChange = (newStatus: TaskStatus) => {
    // Optimistically update UI immediately
    const optimisticValue =
      item.type === 'task'
        ? newStatus
        : newStatus === 'completed'
          ? 'done'
          : newStatus;
    setOptimisticStatus(optimisticValue);

    startTransition(async () => {
      try {
        if (item.type === 'task') {
          const result = await updateTaskStatus(item.id, newStatus, '/today');

          // Clear optimistic state and show toast
          setOptimisticStatus(null);
          const toastId = toast(result.message || 'Status updated', {
            action: {
              label: 'Undo',
              onClick: () => handleUndo(item.id, result.previousStatus),
            },
            duration: 8000,
            icon: getStatusIcon(newStatus),
          });

          setUndoData({
            id: item.id,
            previousStatus: result.previousStatus,
            toastId,
          });
        } else {
          // Habit status update
          const habitStatus =
            newStatus === 'completed'
              ? 'done'
              : newStatus === 'skipped'
                ? 'skipped'
                : 'pending';
          const result = await updateHabitStatus(
            item.id,
            dateString,
            habitStatus,
            '/today',
          );

          // Clear optimistic state and show toast
          setOptimisticStatus(null);
          const toastId = toast(result.message || 'Status updated', {
            action: {
              label: 'Undo',
              onClick: () => handleHabitUndo(item.id, result.previousStatus),
            },
            duration: 8000,
          });
        }
      } catch (e) {
        // Rollback optimistic update with calm error
        setOptimisticStatus(null);
        toast.error("Couldn't save that change", {
          description: 'Your view has been restored.',
          duration: 4000,
        });
      }
    });
  };

  const handleToggle = () => {
    const newStatus = isCompleted ? 'pending' : 'completed';
    handleStatusChange(newStatus as TaskStatus);
  };

  const handleUndo = async (taskId: string, previousStatus: TaskStatus) => {
    try {
      await undoTaskStatus(taskId, previousStatus, '/today');
      toast.success('Restored to previous state');
      setUndoData(null);
    } catch (e) {
      toast.error("Couldn't undo that. Try again?");
    }
  };

  const handleHabitUndo = async (
    taskId: string,
    previousStatus: TaskStatus,
  ) => {
    try {
      const habitStatus =
        previousStatus === 'completed' || previousStatus === ('done' as any)
          ? 'done'
          : previousStatus === 'skipped'
            ? 'skipped'
            : 'pending';
      await updateHabitStatus(taskId, dateString, habitStatus, '/today');
      toast.success('Restored to previous state');
    } catch (e) {
      toast.error("Couldn't restore that one. Try again?");
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
        isCompleted || isSkipped
          ? 'bg-surface/30 border-transparent opacity-60 hover:opacity-100'
          : 'bg-card border-border shadow-sm hover:shadow-md hover:border-primary/20',
      )}
    >
      {/* Checkbox / Action */}
      <button
        onClick={handleToggle}
        disabled={pending}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors focus-ring',
          isCompleted
            ? 'bg-primary border-primary text-primary-foreground'
            : isSkipped
              ? 'bg-muted border-muted-foreground/30 text-muted-foreground'
              : 'border-muted-foreground/40 hover:border-primary text-transparent hover:bg-primary/5',
          pending && 'opacity-50 cursor-wait',
        )}
      >
        {pending ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isCompleted ? (
          <Check className="w-3.5 h-3.5" />
        ) : isSkipped ? (
          <SkipForward className="w-3 h-3" />
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'font-medium truncate transition-all',
              (isCompleted || isSkipped) &&
                'line-through text-muted-foreground',
            )}
          >
            {item.title}
          </span>
          {item.time && (
            <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
              {item.time.slice(0, 5)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {item.type === 'habit' && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-accentDark/70 bg-accent/10 px-1.5 py-0.5 rounded">
              Habit
            </span>
          )}
          {isSkipped && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
              Skipped
            </span>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-all',
              'opacity-0 group-hover:opacity-100 focus:opacity-100',
              'hover:bg-muted text-muted-foreground hover:text-foreground',
            )}
            disabled={pending}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isCompleted && (
            <DropdownMenuItem
              onClick={() => handleStatusChange('completed')}
              className="gap-2"
            >
              <Check className="w-4 h-4 text-green-600" />
              <span>Mark as Done</span>
            </DropdownMenuItem>
          )}

          {isCompleted && (
            <DropdownMenuItem
              onClick={() => handleStatusChange('pending')}
              className="gap-2"
            >
              <Undo2 className="w-4 h-4" />
              <span>Mark as Pending</span>
            </DropdownMenuItem>
          )}

          {item.type === 'task' && !isSkipped && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusChange('skipped')}
                className="gap-2"
              >
                <SkipForward className="w-4 h-4 text-yellow-600" />
                <span>Skip for Today</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('delayed')}
                className="gap-2"
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Delay to Tomorrow</span>
              </DropdownMenuItem>
            </>
          )}

          {item.type === 'habit' && !isSkipped && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusChange('skipped')}
                className="gap-2"
              >
                <SkipForward className="w-4 h-4 text-yellow-600" />
                <span>Skip for Today</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getStatusIcon(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return <Check className="w-4 h-4 text-green-600" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-yellow-600" />;
    case 'delayed':
      return <Clock className="w-4 h-4 text-blue-600" />;
    default:
      return null;
  }
}
