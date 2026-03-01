import { useEffect } from 'react';
import { useJournalStore } from '@/store/journalStore';
import { useCrypto } from '@/crypto/CryptoContext';
import type { DecryptedEntry } from '@/types/journal.types';

interface UseJournalEntryResult {
  entry: DecryptedEntry | null;
  isEmpty: boolean;
  loading: boolean;
  error: string | null;
}

export function useJournalEntry(date: string | null): UseJournalEntryResult {
  const crypto = useCrypto();
  const fetchAndDecryptEntry = useJournalStore((s) => s.fetchAndDecryptEntry);
  const entriesByDate = useJournalStore((s) => s.entriesByDate);
  const loadingDates = useJournalStore((s) => s.loadingDates);
  const errorsByDate = useJournalStore((s) => s.errorsByDate);

  useEffect(() => {
    if (date) void fetchAndDecryptEntry(date, crypto);
  }, [date, fetchAndDecryptEntry, crypto]);

  if (!date) return { entry: null, isEmpty: false, loading: false, error: null };

  const cached = entriesByDate[date];
  const loading = loadingDates.has(date);
  const error = errorsByDate[date] ?? null;

  if (cached === 'empty') return { entry: null, isEmpty: true, loading: false, error: null };
  if (cached) return { entry: cached, isEmpty: false, loading: false, error: null };
  return { entry: null, isEmpty: false, loading, error };
}
