'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// Board Types
// ============================================

export type CardColor =
  | 'default'
  | 'cream'
  | 'sage'
  | 'terracotta'
  | 'sand'
  | 'moss'
  | 'clay';

export type ChecklistItemState =
  | 'todo'
  | 'doing'
  | 'done'
  | 'event'
  | 'event-done'
  | 'note'
  | 'cancelled';

export interface ChecklistItem {
  text: string;
  state: ChecklistItemState;
}

export interface BoardCard {
  id: string;
  column_id: string;
  title: string;
  items: ChecklistItem[];
  order: number;
  color?: CardColor;
}

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
}

export interface Board {
  id: string;
  user_id: string;
  title: string;
  columns: BoardColumn[];
  cards: BoardCard[];
  created_at: string;
  updated_at: string;
}

// ============================================
// Board CRUD Actions
// ============================================

export async function getBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get boards error:', error);
    return [];
  }

  return (data || []) as Board[];
}

export async function getBoard(id: string): Promise<Board | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Get board error:', error);
    return null;
  }

  return data as Board;
}

export async function createBoard(title: string): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const defaultColumns: BoardColumn[] = [
    { id: `col-${Date.now()}-1`, title: 'To Do', order: 0 },
    { id: `col-${Date.now()}-2`, title: 'In Progress', order: 1 },
    { id: `col-${Date.now()}-3`, title: 'Done', order: 2 },
  ];

  const { data, error } = await supabase
    .from('boards')
    .insert({
      user_id: user.id,
      title,
      columns: defaultColumns,
      cards: [],
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create board error:', error);
    throw new Error('Failed to create board');
  }

  revalidatePath('/boards');
  return { id: data.id };
}

export async function updateBoard(
  id: string,
  updates: Partial<Pick<Board, 'title' | 'columns' | 'cards'>>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('boards')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Update board error:', error);
    throw new Error('Failed to update board');
  }

  revalidatePath(`/boards/${id}`);
  revalidatePath('/boards');
}

export async function deleteBoard(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('boards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete board error:', error);
    throw new Error('Failed to delete board');
  }

  revalidatePath('/boards');
}

// ============================================
// Board Card Actions
// ============================================

export async function addBoardCard(
  boardId: string,
  columnId: string,
  title: string,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const columnCards = board.cards.filter((c) => c.column_id === columnId);
  const newCard: BoardCard = {
    id: `card-${Date.now()}`,
    column_id: columnId,
    title,
    items: [],
    order: columnCards.length,
    color: 'default',
  };

  const updatedCards = [...board.cards, newCard];
  await updateBoard(boardId, { cards: updatedCards });
}

export async function updateBoardCard(
  boardId: string,
  cardId: string,
  updates: Partial<BoardCard>,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const updatedCards = board.cards.map((c) =>
    c.id === cardId ? { ...c, ...updates } : c,
  );
  await updateBoard(boardId, { cards: updatedCards });
}

export async function deleteBoardCard(
  boardId: string,
  cardId: string,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const updatedCards = board.cards.filter((c) => c.id !== cardId);
  await updateBoard(boardId, { cards: updatedCards });
}

export async function moveBoardCard(
  boardId: string,
  cardId: string,
  newColumnId: string,
  newOrder: number,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const updatedCards = board.cards.map((c) => {
    if (c.id === cardId) {
      return { ...c, column_id: newColumnId, order: newOrder };
    }
    return c;
  });

  await updateBoard(boardId, { cards: updatedCards });
}

// ============================================
// Board Column Actions
// ============================================

export async function addBoardColumn(
  boardId: string,
  title: string,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const newColumn: BoardColumn = {
    id: `col-${Date.now()}`,
    title,
    order: board.columns.length,
  };

  const updatedColumns = [...board.columns, newColumn];
  await updateBoard(boardId, { columns: updatedColumns });
}

export async function deleteBoardColumn(
  boardId: string,
  columnId: string,
): Promise<void> {
  const board = await getBoard(boardId);
  if (!board) throw new Error('Board not found');

  const updatedColumns = board.columns.filter((c) => c.id !== columnId);
  const updatedCards = board.cards.filter((c) => c.column_id !== columnId);

  await updateBoard(boardId, { columns: updatedColumns, cards: updatedCards });
}
