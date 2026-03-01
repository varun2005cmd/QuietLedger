import type { User } from './auth.types';
import type { RawEntry } from './journal.types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DotDatesResponse {
  dates: string[];
}

export type EntryResponse = RawEntry;

export interface ProfileUpdateRequest {
  display_name?: string;
  picture_url?: string;
}
