/**
 * AuthContext.tsx
 *
 * Global authentication state.
 * Provides: current user, JWT token presence, login, logout, updateUser.
 *
 * Separation of concerns:
 * - This context handles IDENTITY only.
 * - Journal state (entries, selected date, etc.) lives in Zustand.
 * - Encryption logic lives in CryptoContext.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { postGoogleToken } from '@/api/authApi';
import { useJournalStore } from '@/store/journalStore';
import type { User } from '@/types/auth.types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** Called with the Google credential string from @react-oauth/google */
  login: (googleIdToken: string) => Promise<void>;
  /** Signs in as a local demo user — no network calls, no Google needed */
  demoLogin: () => void;
  /** Clears all local state and storage */
  logout: () => void;
  /** Called after a profile update to reflect changes immediately without re-fetching */
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Hydrate from localStorage so a page refresh preserves the session
    const stored = localStorage.getItem('ql_user');
    if (stored) {
      try { return JSON.parse(stored) as User; } catch { return null; }
    }
    return null;
  });

  const clearJournalStore = useJournalStore((s) => s.clear);

  const login = useCallback(async (googleIdToken: string): Promise<void> => {
    const response = await postGoogleToken(googleIdToken);
    localStorage.setItem('ql_jwt', response.access_token);
    localStorage.setItem('ql_user', JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const demoLogin = useCallback((): void => {
    const demoUser: User = {
      id: 'demo',
      email: 'demo@quietledger.local',
      display_name: 'Demo User',
      picture_url: '',
    };
    // Use a fake JWT so the axios interceptor has something to send
    localStorage.setItem('ql_jwt', 'demo_token');
    localStorage.setItem('ql_user', JSON.stringify(demoUser));
    setUser(demoUser);
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem('ql_jwt');
    localStorage.removeItem('ql_user');
    setUser(null);
    clearJournalStore();
  }, [clearJournalStore]);

  const updateUser = useCallback((partial: Partial<User>): void => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem('ql_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, login, demoLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
