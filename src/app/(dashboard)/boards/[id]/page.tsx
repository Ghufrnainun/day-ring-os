import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getBoard, deleteBoard } from '@/actions/boards';
import { BoardView } from '@/components/dashboard/boards/BoardView';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardDetailPage(props: BoardDetailPageProps) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const board = await getBoard(params.id);

  if (!board) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-6 pb-24 sm:pb-8 animate-fade-in h-[calc(100vh-2rem)]">
      {/* Back Link */}
      <Link
        href="/boards"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors w-fit mb-4"
      >
        <ChevronLeft size={16} /> Back to Boards
      </Link>

      {/* Board View */}
      <BoardView board={board} />
    </div>
  );
}
