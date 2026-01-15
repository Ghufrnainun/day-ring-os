'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Repeat, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTaskSheet } from '@/components/dashboard/tasks/CreateTaskSheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function HabitsPage() {
  const { data: user } = useUser();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      // Fetch tasks that are templates (habits) and have repeat rules
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          *,
          repeat_rules (
            rule_type,
            rule_config
          )
        `
        )
        .eq('user_id', user.id)
        .eq('is_template', true)
        .not('deleted_at', 'is', 'null'); // Ensure not deleted if you use soft delete, though checks usually imply 'is null' for active.

      // Wait, standard soft delete check is "deleted_at IS NULL"
      // My schema says deleted_at TIMESTAMPTZ DEFAULT NULL
      // So I should check for null.
      if (error) throw error;
      return data;
    },
  });

  // Correction: filtering is cleaner if I do it in the query:
  const { data: activeHabits, isLoading: isLoadingHabits } = useQuery({
    queryKey: ['habits'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, repeat_rules(rule_type)')
        .eq('user_id', user.id)
        .eq('is_template', true)
        .is('deleted_at', null);

      if (error) throw error;
      return data;
    },
  });

  const { mutate: deleteHabit } = useMutation({
    mutationFn: async (habitId: string) => {
      // Soft delete
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Habit deleted');
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: () => toast.error('Failed to delete habit'),
  });

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-up">
      <header className="flex flex-col space-y-1 pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Habits
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your recurring routines.
        </p>
      </header>

      {/* List */}
      <div className="space-y-3">
        {isLoadingHabits ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Loading habits...
          </div>
        ) : activeHabits?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/20 rounded-2xl bg-white/5 text-center space-y-3">
            <div className="p-3 rounded-full bg-white/5 text-muted-foreground">
              <Repeat size={24} />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No habits yet</p>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                Start building consistency by adding a recurring task.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeHabits?.map((habit: any) => (
              <div
                key={habit.id}
                className="group flex items-center justify-between p-4 bg-card/40 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    <Repeat size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">
                      {habit.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {habit.repeat_rules?.[0]?.rule_type === 'daily'
                        ? 'Repeats Daily'
                        : 'Custom Schedule'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => deleteHabit(habit.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile or specific Add button */}
      <CreateTaskSheet>
        <Button className="w-full h-12 rounded-full text-base font-medium shadow-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 justify-center">
          <Plus size={18} /> New Habit
        </Button>
      </CreateTaskSheet>
    </div>
  );
}
