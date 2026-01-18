'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Clock,
  Mail,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  type Reminder,
} from '@/actions/reminders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface ReminderFormData {
  title: string;
  remind_at: string;
}

export function ReminderManager() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    remind_at: '09:00',
  });
  const [isPending, startTransition] = useTransition();

  // Fetch reminders on mount
  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const data = await getReminders();
      setReminders(data);
    } catch (error: any) {
      // Show dismissible error with short duration - don't block UI
      toast.error("Couldn't load reminders just now. Try refreshing.", {
        duration: 3000,
        dismissible: true,
      });
      console.error('Reminders fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingReminder(null);
    setFormData({ title: '', remind_at: '09:00' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      remind_at: reminder.remind_at,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.info('Please add a title for your reminder');
      return;
    }

    startTransition(async () => {
      try {
        if (editingReminder) {
          await updateReminder({
            id: editingReminder.id,
            title: formData.title,
            remind_at: formData.remind_at,
          });
          toast.success('Reminder updated');
        } else {
          await createReminder({
            title: formData.title,
            remind_at: formData.remind_at,
          });
          toast.success('Reminder created');
        }
        setIsDialogOpen(false);
        fetchReminders();
      } catch (error: any) {
        toast.error(error?.message || "That didn't work. Let's try again.");
      }
    });
  };

  const handleDelete = (reminder: Reminder) => {
    startTransition(async () => {
      try {
        await deleteReminder(reminder.id);
        toast.success('Reminder deleted');
        fetchReminders();
      } catch (error: any) {
        toast.error(error?.message || "Couldn't remove that one. Try again?");
      }
    });
  };

  const handleToggle = (reminder: Reminder) => {
    startTransition(async () => {
      try {
        await toggleReminder(reminder.id, !reminder.enabled);
        // Optimistically update UI
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminder.id ? { ...r, enabled: !r.enabled } : r,
          ),
        );
      } catch (error: any) {
        toast.error(
          error?.message || "The toggle didn't stick. Try once more?",
        );
        fetchReminders(); // Revert on error
      }
    });
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return time;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">Daily Reminders</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenCreate}
          className="text-primary hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Reminder List */}
      {reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-surface/20 p-6">
          <EmptyState
            type="general"
            title="No reminders"
            description="Create a reminder to stay on track."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl',
                'border border-border/50 bg-card/50',
                'transition-all duration-200',
                !reminder.enabled && 'opacity-50',
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggle(reminder)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    reminder.enabled ? 'Disable reminder' : 'Enable reminder'
                  }
                >
                  {reminder.enabled ? (
                    <ToggleRight className="w-5 h-5 text-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      !reminder.enabled && 'line-through',
                    )}
                  >
                    {reminder.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(reminder.remind_at)}</span>
                    <Mail className="w-3 h-3 ml-1" />
                    <span>Email</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(reminder)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Edit reminder"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(reminder)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  aria-label="Delete reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? 'Edit Reminder' : 'New Reminder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">What to remind?</Label>
              <Input
                id="reminder-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Morning meditation"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">When?</Label>
              <Input
                id="reminder-time"
                type="time"
                value={formData.remind_at}
                onChange={(e) =>
                  setFormData({ ...formData, remind_at: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll receive an email at this time daily.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? 'Saving...'
                : editingReminder
                  ? 'Save Changes'
                  : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
