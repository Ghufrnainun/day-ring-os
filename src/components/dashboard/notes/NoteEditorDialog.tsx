'use client';

import * as React from 'react';
import { Maximize2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  saveNote,
  deleteNote,
  convertChecklistItemToTask,
} from '@/actions/notes';

type TemplateType = 'blank' | 'meeting' | 'weekly' | 'billing' | 'project';

const NOTE_TEMPLATES: Array<{
  type: TemplateType;
  label: string;
  helper: string;
  defaultTitle: string;
  defaultBody: string;
}> = [
  {
    type: 'blank',
    label: 'Blank Note',
    helper: 'Free-form space for anything on your mind.',
    defaultTitle: 'Untitled Note',
    defaultBody: '',
  },
  {
    type: 'meeting',
    label: 'Meeting Notes',
    helper: 'Capture agenda, decisions, and next steps.',
    defaultTitle: 'Meeting Notes',
    defaultBody: 'Agenda\n- \n\nNotes\n- \n\nNext steps\n- ',
  },
  {
    type: 'weekly',
    label: 'Weekly Planning',
    helper: 'Plan priorities and energy for the week.',
    defaultTitle: 'Weekly Plan',
    defaultBody:
      'Focus this week\n- \n\nMust-do items\n- \n\nSupportive reminders\n- ',
  },
  {
    type: 'billing',
    label: 'Bills & Payments',
    helper: 'Track what needs to be paid and when.',
    defaultTitle: 'Bills & Payments',
    defaultBody: 'Bills to pay\n- \n\nDue dates\n- \n\nNotes\n- ',
  },
  {
    type: 'project',
    label: 'Project Notes',
    helper: 'Keep tasks, ideas, and references together.',
    defaultTitle: 'Project Notes',
    defaultBody:
      'Goals\n- \n\nOpen questions\n- \n\nTasks to convert later\n- ',
  },
];

interface NoteEditorDialogProps {
  children?: React.ReactNode;
  note?: {
    id: string;
    title: string;
    content?: any;
    template_type?: TemplateType;
    color?: string;
  };
  templateType?: TemplateType;
}

export function NoteEditorDialog({
  children,
  note,
  templateType,
}: NoteEditorDialogProps) {
  // Internal state for the dialog
  const [open, setOpen] = React.useState(false);

  const [title, setTitle] = React.useState(note?.title || '');
  const [content, setContent] = React.useState(note?.content?.body || '');
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateType>(
    note?.template_type ?? templateType ?? 'blank',
  );

  const [hasEdited, setHasEdited] = React.useState(false);

  const [isPending, startTransition] = React.useTransition();

  // Sync when dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle(note?.title || '');
      setContent(note?.content?.body || '');
      setSelectedTemplate(note?.template_type ?? templateType ?? 'blank');
      setHasEdited(false);
    }
  }, [open, note, templateType]);

  React.useEffect(() => {
    if (!open || note?.id || hasEdited) return;
    const template = NOTE_TEMPLATES.find(
      (item) => item.type === selectedTemplate,
    );
    if (!template) return;
    setTitle(template.defaultTitle);
    setContent(template.defaultBody);
  }, [open, note?.id, hasEdited, selectedTemplate]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;

    startTransition(async () => {
      try {
        await saveNote({
          id: note?.id,
          title,
          content: { body: content },
          template_type: selectedTemplate,
        });
        toast.success('Note saved');
        if (!note?.id) setOpen(false); // Close on create, keep open on edit? behavior check
      } catch (e) {
        toast.error('Failed to save note');
      }
    });
  };

  const handleDelete = () => {
    if (!note?.id) return;
    startTransition(async () => {
      try {
        await deleteNote(note.id);
        toast.success('Note deleted');
        setOpen(false);
      } catch (e) {
        toast.error('Failed to delete note');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-white/20 bg-grain sm:rounded-2xl overflow-hidden shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{note ? 'Edit Note' : 'Create New Note'}</DialogTitle>
        </VisuallyHidden>
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
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Done'}
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-visible px-0 pb-0 flex flex-col">
          {!note?.id && (
            <div className="px-8 pt-6 pb-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Templates
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Optional, change anytime
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template.type}
                    type="button"
                    onClick={() => {
                      setHasEdited(false);
                      setSelectedTemplate(template.type);
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-colors',
                      selectedTemplate === template.type
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-white/30 hover:bg-white/50',
                    )}
                  >
                    <div className="text-sm font-medium text-foreground">
                      {template.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {template.helper}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {/* Title */}
            <div className="px-8 pt-4">
              <input
                className="w-full text-4xl font-display font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 text-foreground"
                placeholder="Untitled Note"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasEdited(true);
                }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              <RichTextEditor
                content={content}
                onChange={(newContent) => {
                  setContent(newContent);
                  setHasEdited(true);
                }}
                className="min-h-full"
                editorClassName="min-h-[300px]"
                placeholder="Start writing..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
