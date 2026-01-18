'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Plus,
  Trash2,
  Check,
  Circle,
  Clock,
  Calendar,
  FileText,
  X,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Board,
  BoardCard,
  BoardColumn,
  CardColor,
  ChecklistItem,
  ChecklistItemState,
  updateBoard,
  addBoardCard,
  updateBoardCard,
  deleteBoardCard,
  addBoardColumn,
  deleteBoardColumn,
} from '@/actions/boards';
import { toast } from 'sonner';

// Color palette (Orbit earth tones) - playful sticky note colors
const CARD_COLORS: {
  value: CardColor;
  label: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
  {
    value: 'default',
    label: 'Default',
    bg: 'bg-white',
    border: 'border-stone-200',
    dot: 'bg-stone-300',
  },
  {
    value: 'cream',
    label: 'Cream',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  {
    value: 'sage',
    label: 'Sage',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
  },
  {
    value: 'terracotta',
    label: 'Terracotta',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-400',
  },
  {
    value: 'sand',
    label: 'Sand',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    dot: 'bg-yellow-400',
  },
  {
    value: 'moss',
    label: 'Moss',
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    dot: 'bg-lime-400',
  },
  {
    value: 'clay',
    label: 'Clay',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
  },
];

// Checklist item state config
const STATE_CONFIG: Record<
  ChecklistItemState,
  { icon: React.ReactNode; color: string }
> = {
  todo: {
    icon: <Circle className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/60',
  },
  doing: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-500' },
  done: { icon: <Check className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
  event: {
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: 'text-purple-500',
  },
  'event-done': {
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: 'text-emerald-500',
  },
  note: {
    icon: <FileText className="w-3.5 h-3.5" />,
    color: 'text-orange-500',
  },
  cancelled: {
    icon: <X className="w-3.5 h-3.5" />,
    color: 'text-muted-foreground/40',
  },
};

const STATE_ORDER: ChecklistItemState[] = [
  'todo',
  'doing',
  'done',
  'event',
  'event-done',
  'note',
  'cancelled',
];

interface BoardViewProps {
  board: Board;
}

export function BoardView({ board: initialBoard }: BoardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic state for immediate UI updates
  const [board, setBoard] = useState(initialBoard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(initialBoard.title);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const handleTitleSave = async () => {
    if (newTitle.trim() && newTitle !== board.title) {
      // Optimistic update
      setBoard((prev) => ({ ...prev, title: newTitle.trim() }));

      startTransition(async () => {
        try {
          await updateBoard(board.id, { title: newTitle.trim() });
          toast.success('Board renamed');
        } catch {
          // Revert on error
          setBoard((prev) => ({ ...prev, title: initialBoard.title }));
          toast.error('Failed to rename');
        }
      });
    }
    setEditingTitle(false);
  };

  const handleAddColumn = async () => {
    if (newColumnTitle.trim()) {
      const newCol: BoardColumn = {
        id: `col-${Date.now()}`,
        title: newColumnTitle.trim(),
        order: board.columns.length,
      };

      // Optimistic update
      setBoard((prev) => ({
        ...prev,
        columns: [...prev.columns, newCol],
      }));

      startTransition(async () => {
        try {
          await addBoardColumn(board.id, newColumnTitle.trim());
          router.refresh();
        } catch {
          // Revert
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.filter((c) => c.id !== newCol.id),
          }));
          toast.error('Failed to add column');
        }
      });

      setNewColumnTitle('');
      setAddingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const deletedColumn = board.columns.find((c) => c.id === columnId);
    const deletedCards = board.cards.filter((c) => c.column_id === columnId);

    // Optimistic update
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== columnId),
      cards: prev.cards.filter((c) => c.column_id !== columnId),
    }));

    startTransition(async () => {
      try {
        await deleteBoardColumn(board.id, columnId);
      } catch {
        // Revert
        setBoard((prev) => ({
          ...prev,
          columns: deletedColumn
            ? [...prev.columns, deletedColumn]
            : prev.columns,
          cards: [...prev.cards, ...deletedCards],
        }));
        toast.error('Failed to delete column');
      }
    });
  };

  const handleAddCard = async (columnId: string, title: string) => {
    const newCard: BoardCard = {
      id: `card-${Date.now()}`,
      column_id: columnId,
      title,
      items: [],
      order: board.cards.filter((c) => c.column_id === columnId).length,
      color: 'default',
    };

    // Optimistic update - card appears immediately!
    setBoard((prev) => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));

    startTransition(async () => {
      try {
        await addBoardCard(board.id, columnId, title);
        router.refresh();
      } catch {
        // Revert
        setBoard((prev) => ({
          ...prev,
          cards: prev.cards.filter((c) => c.id !== newCard.id),
        }));
        toast.error('Failed to add card');
      }
    });
  };

  const handleUpdateCard = async (
    cardId: string,
    updates: Partial<BoardCard>,
  ) => {
    const originalCard = board.cards.find((c) => c.id === cardId);

    // Optimistic update
    setBoard((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId ? { ...c, ...updates } : c,
      ),
    }));

    startTransition(async () => {
      try {
        await updateBoardCard(board.id, cardId, updates);
      } catch {
        // Revert
        if (originalCard) {
          setBoard((prev) => ({
            ...prev,
            cards: prev.cards.map((c) => (c.id === cardId ? originalCard : c)),
          }));
        }
        toast.error('Failed to update card');
      }
    });
  };

  const handleDeleteCard = async (cardId: string) => {
    const deletedCard = board.cards.find((c) => c.id === cardId);

    // Optimistic update
    setBoard((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
    }));

    startTransition(async () => {
      try {
        await deleteBoardCard(board.id, cardId);
      } catch {
        // Revert
        if (deletedCard) {
          setBoard((prev) => ({
            ...prev,
            cards: [...prev.cards, deletedCard],
          }));
        }
        toast.error('Failed to delete card');
      }
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          {/* Colored dots decoration */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
          </div>

          {editingTitle ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-xl font-display font-semibold max-w-md bg-transparent border-primary/30"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-display font-semibold cursor-pointer hover:text-primary transition-colors flex items-center gap-2 group"
              onClick={() => setEditingTitle(true)}
            >
              {board.title}
              <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
            </h1>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddingColumn(true)}
          className="gap-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>

      {/* KANBAN Board - Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4">
        <div className="flex gap-4 h-full min-w-max">
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={board.cards.filter((c) => c.column_id === column.id)}
                onAddCard={(title) => handleAddCard(column.id, title)}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onDeleteColumn={() => handleDeleteColumn(column.id)}
                isPending={isPending}
              />
            ))}

          {/* Add Column Button */}
          {addingColumn ? (
            <div className="w-72 shrink-0 p-4 rounded-2xl bg-muted/30 border-2 border-dashed border-primary/30">
              <Input
                placeholder="Column title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                  if (e.key === 'Escape') setAddingColumn(false);
                }}
                className="bg-white"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleAddColumn}
                  className="rounded-full"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAddingColumn(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingColumn(true)}
              className="w-72 shrink-0 h-32 rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Column</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  column: BoardColumn;
  cards: BoardCard[];
  onAddCard: (title: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<BoardCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: () => void;
  isPending: boolean;
}

function KanbanColumn({
  column,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAdd = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
      setAdding(false);
    }
  };

  return (
    <div className="w-72 shrink-0 flex flex-col bg-stone-100/50 rounded-2xl p-3 max-h-[calc(100vh-220px)]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">
            {column.title}
          </h3>
          <span className="text-xs text-muted-foreground bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
            {cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDeleteColumn}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards - Scrollable */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {cards
          .sort((a, b) => a.order - b.order)
          .map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onUpdate={(updates) => onUpdateCard(card.id, updates)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
      </div>

      {/* Add Card */}
      <div className="mt-3 pt-2 border-t border-stone-200/50">
        {adding ? (
          <div className="space-y-2">
            <Input
              placeholder="What needs to be done?"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setAdding(false);
              }}
              className="bg-white text-sm shadow-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                className="rounded-full flex-1 shadow-sm"
              >
                Add Card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/80 rounded-xl"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        )}
      </div>
    </div>
  );
}

// Kanban Card Component - Sticky note style
interface KanbanCardProps {
  card: BoardCard;
  onUpdate: (updates: Partial<BoardCard>) => void;
  onDelete: () => void;
}

function KanbanCard({ card, onUpdate, onDelete }: KanbanCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const colorConfig =
    CARD_COLORS.find((c) => c.value === card.color) || CARD_COLORS[0];

  const handleTitleSave = () => {
    if (title.trim() && title !== card.title) {
      onUpdate({ title: title.trim() });
    }
    setEditingTitle(false);
  };

  const cycleItemState = (index: number) => {
    const currentState = card.items[index].state;
    const currentIndex = STATE_ORDER.indexOf(currentState);
    const nextState = STATE_ORDER[(currentIndex + 1) % STATE_ORDER.length];

    const newItems = [...card.items];
    newItems[index] = { ...newItems[index], state: nextState };
    onUpdate({ items: newItems });
  };

  const addItem = () => {
    if (newItemText.trim()) {
      const newItems: ChecklistItem[] = [
        ...card.items,
        { text: newItemText.trim(), state: 'todo' },
      ];
      onUpdate({ items: newItems });
      setNewItemText('');
      setAddingItem(false);
    }
  };

  const deleteItem = (index: number) => {
    const newItems = card.items.filter((_, i) => i !== index);
    onUpdate({ items: newItems });
  };

  return (
    <div
      className={cn(
        'p-3 rounded-xl border-2 shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 group cursor-default',
        colorConfig.bg,
        colorConfig.border,
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        {editingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className="text-sm font-semibold bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
            autoFocus
          />
        ) : (
          <h4
            className="text-sm font-semibold cursor-text flex-1 leading-tight"
            onClick={() => setEditingTitle(true)}
          >
            {card.title}
          </h4>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shrink-0"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Color Picker */}
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Color
              </p>
              <div className="flex gap-1.5">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      'w-5 h-5 rounded-full transition-all hover:scale-110 shadow-sm',
                      color.dot,
                      card.color === color.value &&
                        'ring-2 ring-primary ring-offset-2',
                    )}
                    onClick={() => onUpdate({ color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Card
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Checklist Items */}
      {card.items.length > 0 && (
        <div className="space-y-1 mt-3 border-t border-black/5 pt-2">
          {card.items.map((item, index) => {
            const stateConfig = STATE_CONFIG[item.state];
            return (
              <div
                key={index}
                className="flex items-start gap-2 text-xs group/item rounded-lg p-1 -mx-1 hover:bg-white/50"
              >
                <button
                  onClick={() => cycleItemState(index)}
                  className={cn(
                    'mt-0.5 transition-colors hover:scale-110',
                    stateConfig.color,
                  )}
                >
                  {stateConfig.icon}
                </button>
                <span
                  className={cn(
                    'flex-1 leading-relaxed',
                    (item.state === 'done' || item.state === 'cancelled') &&
                      'line-through opacity-50',
                  )}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(index)}
                  className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item */}
      {addingItem ? (
        <div className="mt-2 pt-2 border-t border-black/5">
          <Input
            placeholder="Add item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addItem();
              if (e.key === 'Escape') setAddingItem(false);
            }}
            className="text-xs h-7 bg-white/50"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingItem(true)}
          className="mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
        >
          <Plus className="w-3 h-3" />
          Add checklist
        </button>
      )}
    </div>
  );
}
