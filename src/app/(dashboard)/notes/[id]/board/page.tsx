import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBoardData, initializeBoard } from '@/actions/board';
import { BoardView } from '@/components/dashboard/boards/BoardView';
import Link from 'next/link';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get note
  const { data: note } = await supabase
    .from('notes')
    .select('id, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!note) {
    redirect('/notes');
  }

  // Get or initialize board data
  let boardData = await getBoardData(id);

  if (!boardData) {
    // Initialize board with default columns
    await initializeBoard(id);
    boardData = await getBoardData(id);
  }

  if (!boardData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load board
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to Notes
            </Link>
            <h1 className="text-xl font-semibold text-foreground">
              {note.title || 'Untitled Board'}
            </h1>
          </div>

          <Link href={`/notes/${id}`}>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Editor View
            </Button>
          </Link>
        </div>
      </div>

      {/* Board */}
      <BoardView board={boardData} />
    </div>
  );
}
