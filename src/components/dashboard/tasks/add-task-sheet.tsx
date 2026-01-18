'use client';

import { cn } from '@/lib/utils';

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask } from '@/actions/tasks';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface AddTaskSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  defaultDate?: Date; // Pre-fill with specific date
}

export function AddTaskSheet({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  defaultDate,
}: AddTaskSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const pendingRef = useRef(false); // To prevent closing if pending? No, handled by action.

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [scheduledDate, setScheduledDate] = useState<Date>(
    defaultDate || new Date(),
  );

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const dateString = format(scheduledDate, 'yyyy-MM-dd');
        await createTask(formData, dateString);
        const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;
        toast.success(
          isToday
            ? 'Task added to Today'
            : `Task scheduled for ${format(scheduledDate, 'MMM d')}`,
        );
        setOpen?.(false);
        formRef.current?.reset();
        setScheduledDate(new Date()); // Reset to today
      } catch (error) {
        toast.error('Failed to add task');
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add Task</span>
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-background/95 backdrop-blur-xl border-l border-border/50"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">New Task</SheetTitle>
          <SheetDescription>What needs your attention today?</SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Review Q1 Report"
              className="bg-surface/50 border-input font-medium text-lg h-12"
              autoFocus
              required
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal bg-surface/50 border-input',
                    !scheduledDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? (
                    format(scheduledDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={(date) => date && setScheduledDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time (Optional)</Label>
              <Input
                id="time"
                name="time"
                type="time"
                className="bg-surface/50 border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger className="bg-surface/50 border-input">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="pt-4">
            <SheetClose asChild>
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </SheetClose>
            <Button type="submit" disabled={pending} className="min-w-[100px]">
              {pending ? 'Adding...' : 'Add Task'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
