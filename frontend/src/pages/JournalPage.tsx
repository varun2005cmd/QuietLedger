import { format, isToday, parseISO } from 'date-fns';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { JournalEditor } from '@/components/Editor/JournalEditor';
import { EntryViewer } from '@/components/Editor/EntryViewer';
import { useJournalStore } from '@/store/journalStore';
import { useJournalEntry } from '@/hooks/useJournalEntry';
import { useSettingsStore } from '@/store/settingsStore';

function EntryPanel({ date }: { date: string }) {
  const { entry, error } = useJournalEntry(date);
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';

  const dateObj = parseISO(date + 'T12:00:00');
  const dayLabel = isToday(dateObj) ? 'Today' : format(dateObj, 'EEEE');
  const fullLabel = format(dateObj, 'MMMM d, yyyy');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={`mb-6 flex items-baseline justify-between border-b pb-5 ${
        dark ? 'border-neutral-800' : 'border-[#e8e2d6]'
      }`}>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{dayLabel}</h1>
          <p className={`mt-0.5 text-sm ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>{fullLabel}</p>
        </div>
        {!error && (
          <span className={`text-xs rounded-full px-2.5 py-1 ${
            entry
              ? dark ? 'bg-neutral-800 text-neutral-400' : 'bg-[#e8e2d6] text-neutral-500'
              : dark ? 'bg-neutral-900 text-neutral-600' : 'bg-[#f0ece4] text-neutral-400'
          }`}>
            {entry ? '• Entry saved' : 'No entry yet'}
          </span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className={`flex flex-col gap-2 rounded-xl border p-6 ${
          dark ? 'border-red-900/40 bg-red-950/20 text-red-400' : 'border-red-100 bg-red-50 text-red-600'
        }`}>
          <p className="text-sm font-medium">Couldn't load this entry</p>
          <p className="text-xs opacity-75">{error}</p>
        </div>
      ) : entry ? (
        <EntryViewer entry={entry} />
      ) : (
        <JournalEditor date={date} />
      )}
    </div>
  );
}

export function JournalPage() {
  const theme = useSettingsStore((s) => s.theme);
  const dark = theme === 'dark';
  const selectedDate = useJournalStore((s) => s.selectedDate);
  const setSelectedDate = useJournalStore((s) => s.setSelectedDate);
  const setViewDate = useJournalStore((s) => s.setViewDate);
  const setCurrentMonth = useJournalStore((s) => s.setCurrentMonth);
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeDate = selectedDate ?? today;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Calendar ────────────────────────────────────────────── */}
      <aside className={`w-72 shrink-0 overflow-auto border-r p-5 ${
        dark ? 'border-neutral-800' : 'border-[#ddd6c8]'
      }`}>
        <p className={`mb-4 px-1 text-xs font-medium uppercase tracking-widest ${
          dark ? 'text-neutral-600' : 'text-neutral-400'
        }`}>Calendar</p>

        <CalendarView onDateSelect={setSelectedDate} />

        <button
          onClick={() => {
            setSelectedDate(today);
            setViewDate(new Date());
            setCurrentMonth(format(new Date(), 'yyyy-MM'));
          }}
          className={`mt-4 w-full rounded-lg py-2 text-xs font-medium transition-colors ${
            activeDate === today
              ? dark
                ? 'bg-transparent text-neutral-600 ring-1 ring-neutral-800'
                : 'bg-transparent text-neutral-400 ring-1 ring-[#ddd6c8]'
              : dark
              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100'
              : 'bg-[#e8e2d6] text-neutral-600 hover:bg-[#ddd6c8] hover:text-neutral-800'
          }`}
        >
          Jump to today
        </button>
      </aside>

      {/* ── Right: Entry ──────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-auto p-8">
        <EntryPanel key={activeDate} date={activeDate} />
      </main>
    </div>
  );
}
