'use client';

import * as React from 'react';
import { Board } from '@/actions/boards';
import { BoardView } from './BoardView';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface BoardDialogProps {
  board: Board | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardDialog({ board, open, onOpenChange }: BoardDialogProps) {
  if (!board) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-6 bg-background/95 backdrop-blur-xl border-white/20 sm:rounded-3xl overflow-hidden shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Board: {board.title}</DialogTitle>
        </VisuallyHidden>

        <div className="flex-1 min-h-0">
          <BoardView board={board} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
