'use client';

import * as React from 'react';
import { Repeat, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createHabit } from '@/actions/habits';

interface AddHabitSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddHabitSheet({
  children,
  open,
  onOpenChange,
}: AddHabitSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const [title, setTitle] = React.useState('');
  const [frequency, setFrequency] = React.useState<'daily' | 'weekly'>('daily');
  const [reminderTime, setReminderTime] = React.useState('');

  const [isPending, startTransition] = React.useTransition();

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error('Please enter a habit title');
      return;
    }

    startTransition(async () => {
      try {
        await createHabit({
          title,
          frequency,
          reminderTime: reminderTime || undefined,
        });
        toast.success('Habit created!');
        setIsOpen?.(false);
        setTitle('');
        setReminderTime('');
        setFrequency('daily');
      } catch (e) {
        toast.error('Failed to create habit');
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        setIsOpen?.(v);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 rounded-2xl border border-white/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="font-display font-medium text-lg tracking-tight text-primary flex items-center justify-center gap-2">
            <Sparkles size={18} className="text-primary" />
            New Habit
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Input
              placeholder="What do you want to do regularly?"
              className="text-center text-xl font-semibold font-display border-0 border-b-2 border-primary/20 rounded-none focus-visible:ring-0 focus-visible:border-primary/50 bg-transparent h-12 w-full placeholder:text-muted-foreground/50 leading-tight text-foreground"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Frequency Toggle */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Repeat size={12} /> Frequency
            </Label>
            <div className="flex p-1 bg-muted/30 rounded-lg border border-white/10">
              <button
                onClick={() => setFrequency('daily')}
                className={cn(
                  'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                  frequency === 'daily'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setFrequency('weekly')}
                className={cn(
                  'flex-1 py-2 rounded-md text-sm font-medium transition-all',
                  frequency === 'weekly'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label
              htmlFor="reminder"
              className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5"
            >
              <Clock size={12} /> Reminder Time (Optional)
            </Label>
            <Input
              id="reminder"
              type="time"
              className="bg-white/10 border-white/10 h-10 rounded-lg"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              {frequency === 'daily'
                ? 'This will appear every day.'
                : 'This will appear once a week.'}
            </p>
          </div>
        </div>

        <DialogFooter className="p-5 pt-4 border-t border-white/10 bg-white/10">
          <Button
            onClick={handleCreate}
            disabled={isPending}
            className="w-full h-11 rounded-full text-sm font-medium shadow-md transition-all hover:scale-[1.01] bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? 'Creating...' : 'Start Habit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
