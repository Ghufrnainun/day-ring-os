'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createTask } from '@/actions/tasks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QuickAddProps {
  dateString: string;
  timezone: string;
  className?: string;
}

/**
 * Quick Add component for 30-second task creation rule
 * Minimal friction, immediate feedback
 */
export function QuickAdd({ dateString, timezone, className }: QuickAddProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('title', title.trim());
        formData.set('timezone', timezone);
        // No scheduled time - defaults to today

        await createTask(formData);

        // If we get here, task was created successfully
        toast.success('Task added!', {
          description: title.trim(),
          duration: 2000,
        });
        setTitle('');
        setIsExpanded(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to add task');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setTitle('');
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'w-full flex items-center gap-3 p-4 rounded-xl',
          'border border-dashed border-border/50 hover:border-primary/30',
          'bg-surface/20 hover:bg-surface/40',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200 group',
          className
        )}
      >
        <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
          <Plus className="w-3.5 h-3.5 group-hover:text-primary" />
        </div>
        <span className="text-sm">Add a task...</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'border border-primary/30 bg-card shadow-sm',
        'transition-all duration-200 animate-fade-in',
        className
      )}
    >
      <div className="w-6 h-6 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/5">
        <Plus className="w-3.5 h-3.5 text-primary" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        disabled={pending}
        className={cn(
          'flex-1 bg-transparent border-none outline-none',
          'text-foreground placeholder:text-muted-foreground/50',
          'text-sm font-medium',
          pending && 'opacity-50'
        )}
        autoComplete="off"
      />

      <button
        type="submit"
        disabled={pending || !title.trim()}
        className={cn(
          'p-2 rounded-lg transition-all',
          title.trim()
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground',
          pending && 'opacity-50 cursor-wait'
        )}
      >
        {pending ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}

/**
 * Floating Quick Add button for mobile
 */
export function QuickAddFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'w-14 h-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg shadow-primary/25',
        'flex items-center justify-center',
        'hover:scale-105 active:scale-95 transition-transform',
        'md:hidden' // Only show on mobile
      )}
      aria-label="Quick add task"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
