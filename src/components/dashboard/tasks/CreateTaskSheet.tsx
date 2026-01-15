'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  Link as LinkIcon,
  Plus,
  Repeat,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';

export function CreateTaskSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isRecurring, setIsRecurring] = React.useState(false);

  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!title.trim()) throw new Error('Title is required');
      if (!date) throw new Error('Date is required');

      // 1. Create Task Definition
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title,
          description: description,
          is_template: isRecurring,
          // scheduled_at: date.toISOString(), // Optional: for one-off time
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // 2. Create Task Instance for the selected day
      const logicalDay = format(date, 'yyyy-MM-dd');
      const { error: instanceError } = await supabase
        .from('task_instances')
        .insert({
          user_id: user.id,
          task_id: task.id,
          logical_day: logicalDay,
          status: 'pending',
        });

      if (instanceError) throw instanceError;

      // 3. Create Repeat Rule if recurring
      if (isRecurring) {
        const { error: matchError } = await supabase
          .from('repeat_rules')
          .insert({
            user_id: user.id,
            task_id: task.id,
            rule_type: 'daily', // MVP Default
            rule_config: {},
          });
        if (matchError) throw matchError;
      }

      return task;
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      setOpen(false);
      resetForm();
      // Invalidate relevant queries (e.g., today's tasks)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task. Please try again.');
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setIsRecurring(false);
  };

  const handleSubmit = () => {
    createTask();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[540px] p-0 gap-0 bg-background/80 backdrop-blur-xl border-l border-white/20">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />

        {/* Header */}
        <SheetHeader className="px-6 py-6 border-b border-white/10">
          <SheetTitle className="text-2xl font-display font-semibold tracking-tight">
            New Task
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          {/* Title Input */}
          <div className="space-y-3">
            <Label
              htmlFor="title"
              className="text-xs uppercase tracking-wider text-muted-foreground font-medium"
            >
              Task Name
            </Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              className="text-lg font-medium border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-white/40 placeholder:text-white/20 bg-transparent h-auto py-2 transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3 flex flex-col">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                When?
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal border-white/10 bg-white/5 hover:bg-white/10',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3 flex flex-col">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Time (Optional)
              </Label>
              <Button
                variant={'outline'}
                className="w-full justify-start text-left font-normal border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground"
              >
                <Clock className="mr-2 h-4 w-4" />
                <span>All Day</span>
              </Button>
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between py-4 border-y border-white/5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-white/5 text-muted-foreground">
                <Repeat size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-base">Repeat Task</Label>
                <p className="text-xs text-muted-foreground">
                  Make this a recurring habit
                </p>
              </div>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label
              htmlFor="description"
              className="text-xs uppercase tracking-wider text-muted-foreground font-medium"
            >
              Notes / Description
            </Label>
            <textarea
              id="description"
              className="flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none hover:bg-white/10 transition-colors"
              placeholder="Add details, links, or sub-tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="px-6 py-6 border-t border-white/10 bg-white/5">
          <div className="flex w-full gap-3">
            <SheetClose asChild>
              <Button variant="ghost" className="flex-1">
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
