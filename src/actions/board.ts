'use server';

import { createClient } from '@/lib/supabase/server';
import { Board, BoardColumn } from './boards';

export async function getBoardData(id: string): Promise<Board | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single();

  return data as Board;
}

export async function initializeBoard(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Get note title for the board
  const { data: note } = await supabase
    .from('notes')
    .select('title')
    .eq('id', id)
    .single();

  const title = note?.title || 'Untitled Board';

  const defaultColumns: BoardColumn[] = [
    { id: `col-${Date.now()}-1`, title: 'To Do', order: 0 },
    { id: `col-${Date.now()}-2`, title: 'In Progress', order: 1 },
    { id: `col-${Date.now()}-3`, title: 'Done', order: 2 },
  ];

  const { error } = await supabase.from('boards').insert({
    id: id, // specific ID matching the note
    user_id: user.id,
    title: title,
    columns: defaultColumns,
    cards: [],
  });

  if (error) {
    console.error('Error initializing board:', error);
    throw new Error('Failed to initialize board');
  }
}
