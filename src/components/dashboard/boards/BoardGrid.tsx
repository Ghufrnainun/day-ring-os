'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Board, createBoard } from '@/actions/boards';
import { LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BoardDialog } from './BoardDialog';
import { toast } from 'sonner';

interface BoardGridProps {
  boards: Board[];
}

export function BoardGrid({ boards }: BoardGridProps) {
  const router = useRouter();
  const [selectedBoardId, setSelectedBoardId] = React.useState<string | null>(
    null,
  );
  const [isCreating, startCreateTransition] = React.useTransition();
  const pendingBoardId = React.useRef<string | null>(null);

  const selectedBoard = React.useMemo(
    () => boards.find((b) => b.id === selectedBoardId) || null,
    [boards, selectedBoardId],
  );

  // Auto-open newly created board
  React.useEffect(() => {
    if (pendingBoardId.current) {
      const found = boards.find((b) => b.id === pendingBoardId.current);
      if (found) {
        setSelectedBoardId(found.id);
        pendingBoardId.current = null;
      }
    }
  }, [boards]);

  const handleCreateBoard = () => {
    startCreateTransition(async () => {
      try {
        const { id } = await createBoard('New Board');
        pendingBoardId.current = id;
        toast.success('Board created');
        router.refresh();
      } catch (e) {
        toast.error('Failed to create board');
      }
    });
  };

  const handleCreateFirstBoard = () => {
    startCreateTransition(async () => {
      try {
        const { id } = await createBoard('Getting Started');
        pendingBoardId.current = id;
        toast.success('Board created');
        router.refresh();
      } catch (e) {
        toast.error('Failed to create board');
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium">Boards</h1>
          <p className="text-muted-foreground mt-1">
            Organize ideas with drag-and-drop cards
          </p>
        </div>

        {boards.length > 0 && (
          <Button
            onClick={handleCreateBoard}
            disabled={isCreating}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'New Board'}
          </Button>
        )}
      </div>

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No boards yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create your first board to start organizing ideas with colorful
            visible cards.
          </p>
          <Button
            onClick={handleCreateFirstBoard}
            disabled={isCreating}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            {isCreating ? 'Creating...' : 'Create First Board'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => setSelectedBoardId(board.id)}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 text-left w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-lg group-hover:text-primary transition-colors">
                  {board.title}
                </h3>
                <LayoutGrid className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{board.columns.length} columns</span>
                <span>•</span>
                <span>{board.cards.length} cards</span>
              </div>
              {/* Color preview dots */}
              <div className="flex gap-1 mt-4">
                {board.cards.slice(0, 5).map((card, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-primary/20"
                    style={{
                      backgroundColor:
                        card.color === 'sage'
                          ? 'hsl(142 60% 85%)'
                          : card.color === 'terracotta'
                            ? 'hsl(16 50% 80%)'
                            : card.color === 'cream'
                              ? 'hsl(48 80% 90%)'
                              : undefined,
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      <BoardDialog
        board={selectedBoard}
        open={selectedBoard !== null}
        onOpenChange={(open) => !open && setSelectedBoardId(null)}
      />
    </>
  );
}
