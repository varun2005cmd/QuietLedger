/**
 * journalStore.ts
 *
 * Central Zustand store for all journal state.
 *
 * Demo mode: when ql_jwt === 'demo_token', ALL persistence goes to localStorage
 *   under 'ql_demo_entries'. No API calls are made. Entries survive page refresh.
 *
 * Real mode: entries are fetched from the backend API on demand and cached
 *   in-memory for the session. Dot dates are refreshed per month.
 */

import { create } from 'zustand';
import axios from 'axios';
import { getDotDates, getEntry, createEntry, deleteEntry as apiDeleteEntry } from '@/api/entriesApi';
import type { CryptoProvider } from '@/crypto/cryptoProvider';
import type { DecryptedEntry } from '@/types/journal.types';

// ── Demo-mode localStorage helpers ────────────────────────────────────────────
const DEMO_KEY = 'ql_demo_entries';

function isDemoMode(): boolean {
  return localStorage.getItem('ql_jwt') === 'demo_token';
}

function getAllLocalEntries(): Record<string, DecryptedEntry> {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DecryptedEntry>) : {};
  } catch {
    return {};
  }
}

function persistLocalEntry(entry: DecryptedEntry): void {
  const all = getAllLocalEntries();
  all[entry.date] = entry;
  localStorage.setItem(DEMO_KEY, JSON.stringify(all));
}

function removeLocalEntry(date: string): void {
  const all = getAllLocalEntries();
  delete all[date];
  localStorage.setItem(DEMO_KEY, JSON.stringify(all));
}

// ── State / Actions interfaces ────────────────────────────────────────────────
interface JournalState {
  selectedDate: string | null;
  currentMonthKey: string;
  viewDate: Date;
  dotDates: Set<string>;
  entriesByDate: Record<string, DecryptedEntry | 'empty'>;
  loadingDates: Set<string>;
  dotDatesLoading: boolean;
  errorsByDate: Record<string, string>;
  saveError: string | null;
  deleteError: string | null;
}

interface JournalActions {
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (monthKey: string) => void;
  setViewDate: (date: Date) => void;
  fetchDotDates: (month: string) => Promise<void>;
  fetchAndDecryptEntry: (date: string, crypto: CryptoProvider) => Promise<void>;
  saveAndEncryptEntry: (date: string, plaintext: string, crypto: CryptoProvider) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  clearDateError: (date: string) => void;
  clear: () => void;
}

const initialState: JournalState = {
  selectedDate: null,
  currentMonthKey: new Date().toISOString().slice(0, 7),
  viewDate: new Date(),
  dotDates: new Set(),
  entriesByDate: {},
  loadingDates: new Set(),
  dotDatesLoading: false,
  errorsByDate: {},
  saveError: null,
  deleteError: null,
};

export const useJournalStore = create<JournalState & JournalActions>((set, get) => ({
  ...initialState,

  setSelectedDate: (date) => set({ selectedDate: date }),

  setViewDate: (date) => set({ viewDate: date }),

  setCurrentMonth: (monthKey) => {
    if (monthKey === get().currentMonthKey) return;
    set({ currentMonthKey: monthKey, dotDates: new Set() });
    void get().fetchDotDates(monthKey);
  },

  // ── fetchDotDates ──────────────────────────────────────────────────────────
  fetchDotDates: async (month) => {
    set({ dotDatesLoading: true });

    if (isDemoMode()) {
      const all = getAllLocalEntries();
      const dates = Object.keys(all).filter((d) => d.startsWith(month));
      set({ dotDates: new Set(dates), dotDatesLoading: false });
      return;
    }

    try {
      const dates = await getDotDates(month);
      set({ dotDates: new Set(dates), dotDatesLoading: false });
    } catch {
      set({ dotDatesLoading: false });
    }
  },

  // ── fetchAndDecryptEntry ───────────────────────────────────────────────────
  fetchAndDecryptEntry: async (date, _crypto) => {
    const { entriesByDate, loadingDates } = get();
    if (date in entriesByDate) return;
    if (loadingDates.has(date)) return;

    set({ loadingDates: new Set([...get().loadingDates, date]) });

    if (isDemoMode()) {
      const local = getAllLocalEntries();
      const entry = local[date];
      set({
        entriesByDate: { ...get().entriesByDate, [date]: entry ?? 'empty' },
        loadingDates: new Set([...get().loadingDates].filter((d) => d !== date)),
      });
      return;
    }

    try {
      const raw = await getEntry(date);
      if (raw === null) {
        set({
          entriesByDate: { ...get().entriesByDate, [date]: 'empty' },
          loadingDates: new Set([...get().loadingDates].filter((d) => d !== date)),
        });
        return;
      }
      const content = await _crypto.decrypt({ iv: raw.iv, ciphertext: raw.ciphertext });
      const decrypted: DecryptedEntry = {
        id: raw.id,
        date: raw.date,
        content,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
      };
      set({
        entriesByDate: { ...get().entriesByDate, [date]: decrypted },
        loadingDates: new Set([...get().loadingDates].filter((d) => d !== date)),
      });
    } catch (err) {
      const is4xx =
        axios.isAxiosError(err) &&
        err.response?.status !== undefined &&
        err.response.status < 500;
      if (is4xx) {
        set({
          entriesByDate: { ...get().entriesByDate, [date]: 'empty' },
          loadingDates: new Set([...get().loadingDates].filter((d) => d !== date)),
        });
      } else {
        set({
          errorsByDate: { ...get().errorsByDate, [date]: 'Failed to load entry.' },
          loadingDates: new Set([...get().loadingDates].filter((d) => d !== date)),
        });
      }
    }
  },

  // ── saveAndEncryptEntry ────────────────────────────────────────────────────
  saveAndEncryptEntry: async (date, plaintext, crypto) => {
    set({ saveError: null });
    const now = new Date().toISOString();

    if (isDemoMode()) {
      // Persist to localStorage — no API, no encryption needed for demo
      const existing = getAllLocalEntries()[date];
      const entry: DecryptedEntry = {
        id: existing?.id ?? `demo-${date}`,
        date,
        content: plaintext,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
      persistLocalEntry(entry);
      const nextDotDates = new Set(get().dotDates);
      nextDotDates.add(date);
      set({
        entriesByDate: { ...get().entriesByDate, [date]: entry },
        dotDates: nextDotDates,
      });
      return;
    }

    // Real user: encrypt → API
    const encrypted = await crypto.encrypt(plaintext);
    const raw = await createEntry({ date, iv: encrypted.iv, ciphertext: encrypted.ciphertext });
    const decrypted: DecryptedEntry = {
      id: raw.id,
      date: raw.date,
      content: plaintext,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
    const nextDotDates = new Set(get().dotDates);
    nextDotDates.add(date);
    set({
      entriesByDate: { ...get().entriesByDate, [date]: decrypted },
      dotDates: nextDotDates,
    });
  },

  // ── deleteEntry ────────────────────────────────────────────────────────────
  deleteEntry: async (date) => {
    set({ deleteError: null });

    if (isDemoMode()) {
      removeLocalEntry(date);
    } else {
      await apiDeleteEntry(date);
    }

    const nextEntries = { ...get().entriesByDate };
    delete nextEntries[date];
    const nextDotDates = new Set(get().dotDates);
    nextDotDates.delete(date);
    set({ entriesByDate: nextEntries, dotDates: nextDotDates });
  },

  clearDateError: (date) => {
    const next = { ...get().errorsByDate };
    delete next[date];
    set({ errorsByDate: next });
  },

  clear: () => set(initialState),
}));

