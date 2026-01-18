'use client';

import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { format } from 'date-fns';
import { CreateTaskSheet } from './tasks/CreateTaskSheet';
import { toast } from 'sonner';
import { getNextStatus, getUndoToastMessage } from '@/lib/taskStatus';

interface TaskListProps {
  date?: string;
}

type ToggleTaskInput = {
  id: string;
  nextStatus: string;
  previousStatus?: string;
  showUndo?: boolean;
};

export function TaskList({ date }: TaskListProps) {
  const { data: user } = useUser();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', targetDate],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('task_instances')
        .select(
          `
          id,
          status,
          logical_day,
          tasks (
            title,
            description,
            scheduled_at
          )
        `
        )
        .eq('user_id', user.id)
        .eq('logical_day', targetDate)
        .order('status', { ascending: false })
        .order('created_at', { ascending: true, foreignTable: 'tasks' });

      if (error) throw error;
      return data;
    },
  });

  const { mutate: toggleTask } = useMutation({
    mutationFn: async ({ id, nextStatus }: ToggleTaskInput) => {
      const { error } = await supabase
        .from('task_instances')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      return { id, nextStatus };
    },
    onMutate: async ({ id, nextStatus }: ToggleTaskInput) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', targetDate] });
      const previousTasks = queryClient.getQueryData(['tasks', targetDate]);

      queryClient.setQueryData(['tasks', targetDate], (old: any) =>
        old?.map((t: any) => (t.id === id ? { ...t, status: nextStatus } : t))
      );

      return { previousTasks };
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', targetDate], context.previousTasks);
      }
    },
    onSuccess: (data, variables: ToggleTaskInput | undefined) => {
      if (!variables?.showUndo) return;

      const message = getUndoToastMessage(variables.nextStatus);

      toast(message, {
        description: 'You can undo this for a few seconds.',
        action: variables.previousStatus
          ? {
              label: 'Undo',
              onClick: () => {
                toggleTask({
                  id: variables.id,
                  nextStatus: variables.previousStatus as string,
                  showUndo: false,
                });
              },
            }
          : undefined,
        duration: 8000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        Loading tasks...
      </div>
    );
  }

  const sortedTasks = tasks?.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'pending' ? -1 : 1;
  });

  return (
    <div className="space-y-3 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Task Timeline
        </h3>
      </div>

      <div className="space-y-3">
        {sortedTasks?.map((instance: any) => {
          const previousStatus = instance.status as string;
          const nextStatus = getNextStatus(previousStatus);

          return (
            <TaskItem
              key={instance.id}
              title={instance.tasks?.title || 'Untitled Task'}
              time={
                instance.tasks?.scheduled_at
                  ? format(new Date(instance.tasks.scheduled_at), 'h:mm a')
                  : undefined
              }
              completed={instance.status === 'done'}
              onClick={() =>
                toggleTask({
                  id: instance.id,
                  nextStatus,
                  previousStatus,
                  showUndo: true,
                })
              }
            />
          );
        })}
        {tasks?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl bg-white/5">
            No tasks for today. Enjoy your day!
          </div>
        )}
      </div>

      <CreateTaskSheet>
        <button className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground text-sm hover:bg-muted/50 hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> Add task
        </button>
      </CreateTaskSheet>
    </div>
  );
}
