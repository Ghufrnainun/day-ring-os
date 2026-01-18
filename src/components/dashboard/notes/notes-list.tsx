'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { NoteEditorDialog } from '@/components/dashboard/notes/NoteEditorDialog';

interface NotesListProps {
  initialNotes: any[];
}

export function NotesList({ initialNotes }: NotesListProps) {
  const [search, setSearch] = useState('');

  const filteredNotes = initialNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content?.body?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
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
        {filteredNotes.map((note) => (
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

        {filteredNotes.length === 0 && (
          <div className="col-span-2 text-center py-10 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
            {search
              ? 'No matches found.'
              : 'No notes yet. Add one whenever it feels helpful.'}
          </div>
        )}
      </div>
    </>
  );
}
