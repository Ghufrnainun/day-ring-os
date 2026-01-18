'use client';

import * as React from 'react';
import {
  Plus,
  CheckSquare,
  Repeat,
  NotebookPen,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AddTaskSheet } from './tasks/add-task-sheet';
import { AddHabitSheet } from './tasks/AddHabitSheet';
import { AddTransactionSheet } from './finance/AddTransactionSheet';
import { NoteEditorDialog } from './notes/NoteEditorDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function GlobalAddSheet() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSheet, setActiveSheet] = React.useState<
    'none' | 'task' | 'habit' | 'transaction' | 'note'
  >('none');

  const closeAll = () => {
    setIsOpen(false);
    setActiveSheet('none');
  };

  const handleSelect = (sheet_name: typeof activeSheet) => {
    setIsOpen(false); // Close popover
    // Small timeout to allow popover to close cleanly before opening sheet?
    // Usually React handles this fine, but let's just set active.
    setTimeout(() => setActiveSheet(sheet_name), 100);
  };

  const menuItems = [
    {
      id: 'task',
      label: 'Task',
      icon: CheckSquare,
      color: 'bg-blue-500/10 text-blue-600',
      description: 'One-off to-do',
    },
    {
      id: 'habit',
      label: 'Habit',
      icon: Repeat,
      color: 'bg-purple-500/10 text-purple-600',
      description: 'Recurring goal',
    },
    {
      id: 'note',
      label: 'Note',
      icon: NotebookPen,
      color: 'bg-orange-500/10 text-orange-600',
      description: 'Capture thought',
    },
    {
      id: 'transaction',
      label: 'Transaction',
      icon: Wallet,
      color: 'bg-emerald-500/10 text-emerald-600',
      description: 'Log expense',
    },
  ] as const;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={cn(
              'h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50',
              isOpen
                ? 'bg-muted text-foreground rotate-45'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105',
            )}
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Add New</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="w-64 p-2 rounded-2xl bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl mb-2"
          sideOffset={10}
        >
          <div className="grid grid-cols-1 gap-1">
            {menuItems.map((item) => {
              if (item.id === 'note') {
                return (
                  <NoteEditorDialog key={item.id}>
                    <button
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors text-left group w-full"
                      onClick={() => setIsOpen(false)} // Close menu when clicked
                    >
                      <div
                        className={cn(
                          'p-2.5 rounded-lg transition-colors',
                          item.color,
                        )}
                      >
                        <item.icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground/90 group-hover:text-foreground">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  </NoteEditorDialog>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as any)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors text-left group w-full"
                >
                  <div
                    className={cn(
                      'p-2.5 rounded-lg transition-colors',
                      item.color,
                    )}
                  >
                    <item.icon size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-foreground/90 group-hover:text-foreground">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Controlled Sheets - No children means no trigger renders */}
      <AddTaskSheet
        open={activeSheet === 'task'}
        onOpenChange={(open) => !open && setActiveSheet('none')}
        trigger={<span className="hidden" />}
      />

      <AddHabitSheet
        open={activeSheet === 'habit'}
        onOpenChange={(open) => !open && setActiveSheet('none')}
      />

      <AddTransactionSheet
        open={activeSheet === 'transaction'}
        onOpenChange={(open) => !open && setActiveSheet('none')}
      />

      {/* Note is handled inline via NoteEditorDialog trigger wrapper above */}
    </>
  );
}
