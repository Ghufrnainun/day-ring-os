'use client';

import * as React from 'react';
import {
  Search,
  X,
  Link as LinkIcon,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  linkTransactionToNote,
  linkTransactionToTask,
  unlinkTransactionFromNote,
  unlinkTransactionFromTask,
  getTransactionLinkedNotes,
  getTransactionLinkedTasks,
  searchNotesForLinking,
  searchTasksForLinking,
  type LinkedNote,
  type LinkedTask,
} from '@/actions/entity-links';
import { toast } from 'sonner';

interface TransactionLinkSelectorProps {
  transactionId: string;
  onLinksChange?: () => void;
}

export function TransactionLinkSelector({
  transactionId,
  onLinksChange,
}: TransactionLinkSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [linkType, setLinkType] = React.useState<'task' | 'note'>('task');
  const [linkedNotes, setLinkedNotes] = React.useState<LinkedNote[]>([]);
  const [linkedTasks, setLinkedTasks] = React.useState<LinkedTask[]>([]);
  const [searchResults, setSearchResults] = React.useState<
    (LinkedNote | LinkedTask)[]
  >([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Load linked items
  const loadLinks = React.useCallback(async () => {
    const [notes, tasks] = await Promise.all([
      getTransactionLinkedNotes(transactionId),
      getTransactionLinkedTasks(transactionId),
    ]);
    setLinkedNotes(notes);
    setLinkedTasks(tasks);
  }, [transactionId]);

  React.useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  // Search for items to link
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results =
          linkType === 'note'
            ? await searchNotesForLinking(searchQuery)
            : await searchTasksForLinking(searchQuery);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, linkType]);

  const handleLink = (item: LinkedNote | LinkedTask) => {
    startTransition(async () => {
      try {
        if (linkType === 'note') {
          await linkTransactionToNote(transactionId, item.id);
          toast.success('Linked to note');
        } else {
          await linkTransactionToTask(transactionId, item.id);
          toast.success('Linked to task');
        }
        setSearchQuery('');
        await loadLinks();
        onLinksChange?.();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to link');
      }
    });
  };

  const handleUnlink = (
    item: LinkedNote | LinkedTask,
    type: 'note' | 'task',
  ) => {
    startTransition(async () => {
      try {
        if (type === 'note') {
          await unlinkTransactionFromNote(transactionId, item.id);
          toast.success('Unlinked from note');
        } else {
          await unlinkTransactionFromTask(transactionId, item.id);
          toast.success('Unlinked from task');
        }
        await loadLinks();
        onLinksChange?.();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to unlink');
      }
    });
  };

  const totalLinks = linkedNotes.length + linkedTasks.length;

  return (
    <div className="space-y-2">
      {/* Linked Items */}
      {totalLinks > 0 && (
        <div className="flex flex-wrap gap-2">
          {linkedNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs"
            >
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{note.title}</span>
              <button
                onClick={() => handleUnlink(note, 'note')}
                disabled={isPending}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {linkedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs"
            >
              <CheckSquare className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{task.title}</span>
              <button
                onClick={() => handleUnlink(task, 'task')}
                disabled={isPending}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <LinkIcon className="w-3 h-3 mr-2" />
            {totalLinks > 0 ? `${totalLinks} linked` : 'Add link'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            {/* Link Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={linkType === 'task' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLinkType('task');
                  setSearchQuery('');
                }}
                className="flex-1"
              >
                <CheckSquare className="w-3 h-3 mr-1" />
                Task
              </Button>
              <Button
                variant={linkType === 'note' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLinkType('note');
                  setSearchQuery('');
                }}
                className="flex-1"
              >
                <FileText className="w-3 h-3 mr-1" />
                Note
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${linkType}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {isSearching ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Searching...
                  </p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLink(item)}
                      disabled={isPending}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      {item.title}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No {linkType}s found
                  </p>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
