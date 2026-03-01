import { useState, useEffect, useRef } from 'react';
import { useJournalStore } from '@/store/journalStore';
import { useCrypto } from '@/crypto/CryptoContext';
import { useSettingsStore } from '@/store/settingsStore';
import { format } from 'date-fns';

interface JournalEditorProps {
  date: string;
  /** Pre-fill for edit mode */
  initialContent?: string;
  onCancel?: () => void;
}

export function JournalEditor({ date, initialContent = '', onCancel }: JournalEditorProps) {
  const crypto = useCrypto();
  const theme = useSettingsStore((s) => s.theme);
  const saveAndEncryptEntry = useJournalStore((s) => s.saveAndEncryptEntry);

  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setSaved(false);
    setLocalError(null);
  }, [date, initialContent]);

  // Auto-focus on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const dateLabel = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy');

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setLocalError(null);
    try {
      await saveAndEncryptEntry(date, content.trim(), crypto);
      setSaved(true);
    } catch {
      setLocalError('Failed to save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      void handleSave();
    }
  };

  const dark = theme === 'dark';

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-medium ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {dateLabel}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${
              dark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind today?"
        className={`flex-1 min-h-[260px] w-full resize-none rounded-xl border px-5 py-4 font-sans text-[15px] leading-relaxed outline-none transition-colors ${
          dark
            ? 'border-neutral-700 bg-[#1a1a18] text-[#e8e6e1] placeholder-neutral-700 focus:border-neutral-500'
            : 'border-[#ddd6c8] bg-[#faf7f2] text-[#1a1a1a] placeholder-[#c0b9af] focus:border-[#b8b0a5]'
        }`}
        disabled={saving}
      />

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className={`text-xs ${dark ? 'text-neutral-600' : 'text-neutral-400'}`}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · {content.length} chars
        </span>

        <div className="flex items-center gap-3">
          {saved && (
            <span className={`text-xs ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              ✓ Encrypted &amp; saved
            </span>
          )}
          {localError && (
            <span className="text-xs text-red-500">{localError}</span>
          )}
          <span className={`text-xs hidden sm:block ${dark ? 'text-neutral-700' : 'text-neutral-300'}`}>
            ⌘S to save
          </span>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
              dark
                ? 'bg-neutral-200 text-neutral-900 hover:bg-white'
                : 'bg-neutral-900 text-white hover:bg-neutral-700'
            }`}
          >
            {saving ? 'Saving…' : onCancel ? 'Update entry' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
