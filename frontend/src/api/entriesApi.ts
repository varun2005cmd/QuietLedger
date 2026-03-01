/**
 * entriesApi.ts
 *
 * All entry-related API calls.
 * Notice: no function here accepts or returns a 'content' (plaintext) field.
 * Plaintext only exists inside the crypto layer and Zustand store — never here.
 */

import { apiClient } from './axiosClient';
import type { DotDatesResponse, EntryResponse } from '@/types/api.types';
import type { EntryCreatePayload, RawEntry } from '@/types/journal.types';

/** Fetch the encrypted entry for a specific date, or null if 404. */
export async function getEntry(date: string): Promise<RawEntry | null> {
  try {
    const response = await apiClient.get<EntryResponse>('/entries', {
      params: { date },
    });
    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/** Fetch a list of "YYYY-MM-DD" strings that have entries in a given month. */
export async function getDotDates(month: string): Promise<string[]> {
  const response = await apiClient.get<DotDatesResponse>('/entries/dates', {
    params: { month },
  });
  return response.data.dates;
}

/**
 * Create or update an entry.
 * The payload contains only { date, iv, ciphertext } — no plaintext.
 */
export async function createEntry(payload: EntryCreatePayload): Promise<RawEntry> {
  const response = await apiClient.post<EntryResponse>('/entries', payload);
  return response.data;
}

/** Delete the entry for a date. Resolves whether or not an entry existed. */
export async function deleteEntry(date: string): Promise<void> {
  await apiClient.delete(`/entries/${date}`);
}
