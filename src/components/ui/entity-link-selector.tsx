'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Link2, Unlink, FileText, CheckSquare, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  searchNotesForLinking,
  searchTasksForLinking,
  linkNoteToTask,
  unlinkNoteFromTask,
  type LinkedNote,
  type LinkedTask,
} from '@/actions/entity-links';

interface EntityLinkSelectorProps {
  type: 'note' | 'task';
  sourceId: string;
  linkedItems: LinkedNote[] | LinkedTask[];
  onLinkChange?: () => void;
  className?: string;
}

/**
 * Reusable component for linking entities (Notes ↔ Tasks)
 */
export function EntityLinkSelector({
  type,
  sourceId,
  linkedItems,
  onLinkChange,
  className,
}: EntityLinkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    LinkedNote[] | LinkedTask[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  // Determine if we're linking notes or tasks
  const targetType = type === 'note' ? 'task' : 'note';
  const Icon = targetType === 'note' ? FileText : CheckSquare;

  // Search for items to link
  const handleSearch = React.useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results =
          targetType === 'note'
            ? await searchNotesForLinking(query)
            : await searchTasksForLinking(query);

        // Filter out already linked items
        const linkedIds = new Set(linkedItems.map((item) => item.id));
        const filtered = results.filter((item) => !linkedIds.has(item.id));

        setSearchResults(filtered as LinkedNote[] | LinkedTask[]);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [targetType, linkedItems],
  );

  // Link an item
  const handleLink = (targetId: string) => {
    startTransition(async () => {
      try {
        if (type === 'note') {
          await linkNoteToTask(sourceId, targetId);
        } else {
          await linkNoteToTask(targetId, sourceId);
        }
        toast.success('Linked successfully');
        setSearchQuery('');
        setSearchResults([]);
        onLinkChange?.();
      } catch (error: any) {
        toast.error(error?.message || "Couldn't create that link. Try again?");
      }
    });
  };

  // Unlink an item
  const handleUnlink = (targetId: string) => {
    startTransition(async () => {
      try {
        if (type === 'note') {
          await unlinkNoteFromTask(sourceId, targetId);
        } else {
          await unlinkNoteFromTask(targetId, sourceId);
        }
        toast.success('Unlinked');
        onLinkChange?.();
      } catch (error: any) {
        toast.error(error?.message || "Couldn't remove that link. Try again?");
      }
    });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Linked Items */}
      {linkedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linkedItems.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/20 text-sm group"
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground max-w-[120px] truncate">
                {item.title}
              </span>
              <button
                onClick={() => handleUnlink(item.id)}
                disabled={pending}
                className="ml-1 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Unlink ${item.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="w-3.5 h-3.5 mr-1" />
            Link {targetType === 'note' ? 'note' : 'task'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${targetType}s...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="max-h-48 overflow-y-auto">
              {isSearching ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Searching...
                </p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLink(item.id)}
                      disabled={pending}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left',
                        'text-sm hover:bg-muted transition-colors',
                        pending && 'opacity-50 cursor-wait',
                      )}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No {targetType}s found
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Type to search {targetType}s
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Simple badge to show linked count
 */
export function LinkedBadge({
  count,
  type,
  className,
}: {
  count: number;
  type: 'notes' | 'tasks';
  className?: string;
}) {
  if (count === 0) return null;

  const Icon = type === 'notes' ? FileText : CheckSquare;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
        'bg-muted text-muted-foreground',
        className,
      )}
      title={`${count} linked ${type}`}
    >
      <Icon className="w-3 h-3" />
      {count}
    </div>
  );
}
