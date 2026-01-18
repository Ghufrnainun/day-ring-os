import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotesList } from '@/components/dashboard/notes/notes-list';

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-up">
      <header className="flex flex-col space-y-1 pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Notes & Plans
        </h1>
        <p className="text-muted-foreground text-sm">
          Capture thoughts and organize your mind.
        </p>
      </header>

      <NotesList initialNotes={notes || []} />
    </div>
  );
}
