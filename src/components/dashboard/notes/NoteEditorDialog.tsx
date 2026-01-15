'use client';

import * as React from 'react';
import { Maximize2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { toast } from 'sonner';

interface NoteEditorDialogProps {
  children?: React.ReactNode;
  note?: { id: string; title: string; content?: any; color?: string };
}

export function NoteEditorDialog({ children, note }: NoteEditorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(note?.title || '');
  const [content, setContent] = React.useState(note?.content?.body || '');

  const { data: user } = useUser();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Reset state when note prop changes or dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle(note?.title || '');
      setContent(note?.content?.body || '');
    }
  }, [open, note]);

  const { mutate: saveNote, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User auth missing');
      if (!title.trim() && !content.trim()) return; // Don't save empty

      const payload: any = {
        user_id: user.id,
        title: title || 'Untitled Note',
        content: { body: content },
        updated_at: new Date().toISOString(),
      };

      if (note?.id) {
        payload.id = note.id;
      }

      const { error } = await supabase.from('notes').upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Note saved');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setOpen(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to save note');
    },
  });

  const handleDelete = async () => {
    if (!note?.id) return;
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (!error) {
      toast.success('Note deleted');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/20 bg-grain sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <span className="text-xs font-mono text-muted-foreground">
            {note ? 'Editing' : 'New Note'}
          </span>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={!note?.id}
                >
                  Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full bg-white/5 hover:bg-white/10 hover:text-primary transition-colors"
              onClick={() => saveNote()}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Done'}
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-4">
          {/* Title */}
          <input
            className="w-full text-4xl font-display font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 text-foreground"
            placeholder="Untitled Note"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {/* Body */}
          <textarea
            className="w-full h-full min-h-[400px] resize-none text-lg leading-relaxed bg-transparent border-none focus:outline-none text-muted-foreground/90 placeholder:text-muted-foreground/30 font-serif"
            placeholder="Start typing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
