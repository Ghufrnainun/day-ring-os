'use client';

import { Plus, Search } from 'lucide-react';
import { NoteEditorDialog } from '@/components/dashboard/notes/NoteEditorDialog';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useState } from 'react';

export default function NotesPage() {
  const { data: user } = useUser();
  const supabase = createClient();
  const [search, setSearch] = useState('');

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredNotes = notes?.filter(
    (note: any) => note.title.toLowerCase().includes(search.toLowerCase())
    // || note.content?.body?.toLowerCase().includes(search.toLowerCase()) // Optional: deep search
  );

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-up">
      {/* Header */}
      <header className="flex flex-col space-y-1 pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Notes & Plans
        </h1>
        <p className="text-muted-foreground text-sm">
          Capture thoughts and organize your mind.
        </p>
      </header>

      {/* Search / Action */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/60 bg-white/20 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NoteEditorDialog>
          <button className="flex items-center justify-center p-2.5 rounded-xl border border-border/60 bg-white/20 hover:bg-white/40 transition-colors">
            <Plus className="w-5 h-5 text-foreground" />
          </button>
        </NoteEditorDialog>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up-delay-1">
        {isLoading && (
          <div className="col-span-2 text-center text-sm text-muted-foreground py-10">
            Loading notes...
          </div>
        )}

        {filteredNotes?.map((note: any) => (
          <NoteEditorDialog key={note.id} note={note}>
            <div
              className={`p-4 rounded-2xl border border-black/5 bg-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col h-40 justify-between`}
            >
              <div className="space-y-1">
                <div className="w-8 h-1 rounded-full bg-black/10 mb-2"></div>
                <h3 className="font-semibold text-foreground leading-tight text-balance">
                  {note.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {note.content?.body || 'No content'}
              </p>
            </div>
          </NoteEditorDialog>
        ))}

        {filteredNotes?.length === 0 && !isLoading && (
          <div className="col-span-2 text-center py-10 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
            No notes found.
          </div>
        )}
      </div>
    </div>
  );
}
