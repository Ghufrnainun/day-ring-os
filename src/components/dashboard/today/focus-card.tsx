'use client';

import { useTransition } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleTask } from '@/actions/today';
import { toast } from 'sonner';

interface FocusCardProps {
  task: any;
}

export function FocusCard({ task }: FocusCardProps) {
  const [pending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await toggleTask(task.id, task.status, '/today');
        toast.success('Task completed! Great work.');
      } catch (e) {
        toast.error('Failed to update task.');
      }
    });
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-card border border-border shadow-md transition-all hover:shadow-lg">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

      <div className="p-6 sm:p-8">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Current Focus
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-display font-medium text-foreground leading-tight">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {task.due_time && (
              <div className="flex items-center text-sm text-muted-foreground/80 mt-2">
                <Clock className="w-4 h-4 mr-1.5" />
                {task.due_time?.slice(0, 5)}
              </div>
            )}
          </div>

          <button
            onClick={handleComplete}
            disabled={pending}
            className={cn(
              'flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300',
              'hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/10',
              pending
                ? 'border-muted text-muted opacity-50 cursor-wait'
                : 'border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary'
            )}
            aria-label="Complete task"
          >
            {pending ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
