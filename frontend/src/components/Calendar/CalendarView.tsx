import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { useJournalStore } from '@/store/journalStore';
import { useSettingsStore } from '@/store/settingsStore';
import 'react-calendar/dist/Calendar.css';

type CalendarValue = Date | null | [Date | null, Date | null];

interface CalendarViewProps {
  onDateSelect?: (date: string) => void;
}

function toYMD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function toMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

/**
 * CalendarView
 *
 * Renders a monthly calendar using react-calendar.
 * - Dot indicators show days that have entries (from Zustand dotDates).
 * - Clicking a day updates the selectedDate in the store.
 * - Navigating months triggers fetchDotDates for the new month.
 * - No re-mount on navigation — state is preserved in Zustand.
 */
export function CalendarView({ onDateSelect }: CalendarViewProps) {
  const theme = useSettingsStore((s) => s.theme);
  const selectedDate = useJournalStore((s) => s.selectedDate);
  const dotDates = useJournalStore((s) => s.dotDates);
  const setSelectedDate = useJournalStore((s) => s.setSelectedDate);
  const setCurrentMonth = useJournalStore((s) => s.setCurrentMonth);
  const setViewDate = useJournalStore((s) => s.setViewDate);
  const viewDate = useJournalStore((s) => s.viewDate);
  

  const handleChange = (value: CalendarValue) => {
    const date = Array.isArray(value) ? value[0] : value;
    if (!date) return;
    const ymd = toYMD(date);
    setSelectedDate(ymd);
    onDateSelect?.(ymd);
  };

  const handleActiveStartDateChange = ({
    activeStartDate,
    view,
  }: {
    activeStartDate: Date | null;
    view: string;
  }) => {
    if (!activeStartDate) return;
    setViewDate(activeStartDate);
    // Only refresh dot-dates when navigating between months (not year/decade views)
    if (view === 'month') {
      setCurrentMonth(toMonthKey(activeStartDate));
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const ymd = toYMD(date);
    if (!dotDates.has(ymd)) return null;
    return (
      <div className="flex justify-center mt-0.5">
        <span
          className={`block h-1 w-1 rounded-full ${
            theme === 'dark' ? 'bg-neutral-400' : 'bg-neutral-600'
          }`}
        />
      </div>
    );
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;

  return (
    <div className="relative">
      <Calendar
        onChange={handleChange}
        value={selectedDateObj}
        activeStartDate={viewDate}
        onActiveStartDateChange={handleActiveStartDateChange}
        tileContent={tileContent}
        showNeighboringMonth={false}
        locale="en-US"
        minDate={new Date(2000, 0, 1)}
        maxDate={new Date(2099, 11, 31)}
        minDetail="month"
      />
    </div>
  );
}
