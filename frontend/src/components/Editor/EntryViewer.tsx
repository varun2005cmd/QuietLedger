import { useState } from 'react';
import { useJournalStore } from '@/store/journalStore';
import { useSettingsStore } from '@/store/settingsStore';
import { JournalEditor } from '@/components/Editor/JournalEditor';
import type { DecryptedEntry } from '@/types/journal.types';

interface EntryViewerProps {
  entry: DecryptedEntry;
}

export function EntryViewer({ entry }: EntryViewerProps) {
  const theme = useSettingsStore((s) => s.theme);
  const deleteEntry = useJournalStore((s) => s.deleteEntry);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <JournalEditor
        date={entry.date}
        initialContent={entry.content}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteEntry(entry.date);
    } catch {
      setError('Failed to delete. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const dark = theme === 'dark';

  return (
    <div className="flex flex-col gap-5">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-medium ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {dateLabel}
        </h2>
        <button
          onClick={() => setEditing(true)}
          className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
            dark ? 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300' : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
          }`}
        >
          Edit
        </button>
      </div>

      {/* Content */}
      <p className={`font-sans text-[15px] leading-relaxed whitespace-pre-wrap ${dark ? 'text-[#d4d0c8]' : 'text-[#2a2a2a]'}`}>
        {entry.content}
      </p>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-4 mt-auto border-t ${
        dark ? 'border-neutral-800' : 'border-[#e8e2d6]'
      }`}>
        <span className={`text-xs ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>
          Saved {new Date(entry.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          {entry.content.trim().split(/\s+/).length} words
        </span>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {confirmDelete && !deleting && (
            <span className={`text-xs ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>Tap again to confirm</span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 ${
              confirmDelete
                ? 'text-red-500 hover:text-red-400'
                : dark
                ? 'text-neutral-600 hover:bg-neutral-800 hover:text-red-400'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-red-500'
            }`}
          >
            {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
