/**
 * useDotDates.ts
 *
 * Fetches dot-dates for a given month if not already in the store.
 * Returns loading state and the current dotDates set.
 */

import { useEffect } from 'react';
import { useJournalStore } from '@/store/journalStore';

export function useDotDates(monthKey: string) {
  const fetchDotDates = useJournalStore((s) => s.fetchDotDates);
  const currentMonthKey = useJournalStore((s) => s.currentMonthKey);
  const dotDates = useJournalStore((s) => s.dotDates);
  const loading = useJournalStore((s) => s.dotDatesLoading);

  useEffect(() => {
    if (monthKey !== currentMonthKey) {
      void fetchDotDates(monthKey);
    }
  }, [monthKey, currentMonthKey, fetchDotDates]);

  return { dotDates, loading };
}
