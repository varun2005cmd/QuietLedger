import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJournalStore } from '@/store/journalStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCrypto } from '@/crypto/CryptoContext';
import type { DecryptedEntry } from '@/types/journal.types';
import { format, parseISO } from 'date-fns';

const DEMO_KEY = 'ql_demo_entries';
function isDemoMode() { return localStorage.getItem('ql_jwt') === 'demo_token'; }
function getAllLocalEntries(): DecryptedEntry[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, DecryptedEntry>);
  } catch { return []; }
}

function EntryCard({ entry, onClick }: { entry: DecryptedEntry; onClick: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const dateObj = parseISO(entry.date + 'T12:00:00');
  const wordCount = entry.content.trim().split(/\s+/).length;

  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border p-5 transition-colors ${
        dark
          ? 'border-neutral-800 bg-[#161614] hover:border-neutral-700'
          : 'border-[#e8e2d6] bg-[#faf7f2] hover:border-[#c8bfb2] shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className={`text-xs font-medium uppercase tracking-widest ${
            dark ? 'text-neutral-500' : 'text-neutral-400'
          }`}>
            {format(dateObj, 'MMMM d, yyyy')}
          </p>
          <p className={`text-xs mt-0.5 ${
            dark ? 'text-neutral-600' : 'text-neutral-400'
          }`}>
            {format(dateObj, 'EEEE')} &middot; {wordCount} {wordCount === 1 ? 'word' : 'words'} &middot; {entry.content.length} chars
          </p>
        </div>
        <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
          dark ? 'text-neutral-500' : 'text-neutral-400'
        }`}>
          View &rarr;
        </span>
      </div>
      <p className={`font-sans text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 ${
        dark ? 'text-neutral-300' : 'text-neutral-700'
      }`}>
        {entry.content}
      </p>
    </article>
  );
}

export function HistoryPage() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const crypto = useCrypto();
  const navigate = useNavigate();

  const entriesByDate = useJournalStore((s) => s.entriesByDate);
  const dotDates = useJournalStore((s) => s.dotDates);
  const fetchAndDecryptEntry = useJournalStore((s) => s.fetchAndDecryptEntry);
  const fetchDotDates = useJournalStore((s) => s.fetchDotDates);
  const currentMonthKey = useJournalStore((s) => s.currentMonthKey);
  const setSelectedDate = useJournalStore((s) => s.setSelectedDate);
  const dotDatesLoading = useJournalStore((s) => s.dotDatesLoading);

  // Demo mode: read directly from localStorage — includes ALL months, not just current
  const [demoEntries, setDemoEntries] = useState<DecryptedEntry[]>(() =>
    isDemoMode() ? getAllLocalEntries() : []
  );

  // Refresh demo entries whenever the component is focused or store changes
  useEffect(() => {
    if (isDemoMode()) {
      setDemoEntries(getAllLocalEntries());
    } else {
      void fetchDotDates(currentMonthKey);
    }
  }, [fetchDotDates, currentMonthKey, entriesByDate]);

  useEffect(() => {
    if (!isDemoMode()) {
      for (const d of dotDates) {
        void fetchAndDecryptEntry(d, crypto);
      }
    }
  }, [dotDates, fetchAndDecryptEntry, crypto]);

  const loadedEntries: DecryptedEntry[] = isDemoMode()
    ? demoEntries.sort((a, b) => b.date.localeCompare(a.date))
    : Object.values(entriesByDate)
        .filter((e): e is DecryptedEntry => e !== 'empty')
        .sort((a, b) => b.date.localeCompare(a.date));

  const isLoading = dotDatesLoading && loadedEntries.length === 0 && !isDemoMode();

  const handleCardClick = (date: string) => {
    setSelectedDate(date);
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-3xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className={`mt-1 text-sm ${
          dark ? 'text-neutral-500' : 'text-neutral-400'
        }`}>
          {'Previous entries'}
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-28 w-full rounded-xl ${
              dark ? 'bg-neutral-800/50' : 'bg-neutral-100'
            }`} />
          ))}
        </div>
      ) : loadedEntries.length === 0 ? (
        <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border py-24 text-center ${
          dark ? 'border-neutral-800' : 'border-[#e8e2d6]'
        }`}>
          <p className={`text-sm ${
            dark ? 'text-neutral-500' : 'text-neutral-400'
          }`}>
            {isDemoMode() ? 'No entries yet.' : 'No entries this month.'}
          </p>
          <p className={`text-xs ${
            dark ? 'text-neutral-600' : 'text-neutral-500'
          }`}>
            Head to Journal and write your first entry.
          </p>
          <button
            onClick={() => navigate('/')}
            className={`mt-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              dark
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'bg-neutral-900 text-white hover:bg-neutral-700'
            }`}
          >
            Write now
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loadedEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onClick={() => handleCardClick(entry.date)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
