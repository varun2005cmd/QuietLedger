/**
 * settingsStore.ts
 *
 * Manages user preferences that must persist across sessions.
 *
 * Theme: persisted in localStorage and applied to <html> element.
 * The store hydrates from localStorage on initialization so the correct theme
 * is applied before the first render — preventing any flash of wrong theme.
 */

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
}

interface SettingsActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function getStoredTheme(): Theme {
  const stored = localStorage.getItem('ql_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('ql_theme', theme);
}

// Apply theme immediately on module load — before any component renders
const initialTheme = getStoredTheme();
applyTheme(initialTheme);

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  theme: initialTheme,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    set({ theme: next });
  },
}));
