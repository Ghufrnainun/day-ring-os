import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBoards } from '@/actions/boards';
import { BoardGrid } from '@/components/dashboard/boards/BoardGrid';

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const boards = await getBoards();

  return (
    <div className="max-w-6xl mx-auto py-6 pb-24 sm:pb-8 animate-fade-in">
      <BoardGrid boards={boards} />
    </div>
  );
}
