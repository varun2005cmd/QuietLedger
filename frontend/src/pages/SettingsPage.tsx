import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useSettingsStore } from '@/store/settingsStore';
import { updateProfile } from '@/api/usersApi';

/**
 * SettingsPage
 *
 * Three independent sections:
 * 1. Theme toggle — immediate, persisted in localStorage.
 * 2. Display name — PUT /users/profile, optimistically updates AuthContext.
 * 3. Profile picture URL — PUT /users/profile, optimistically updates AuthContext.
 *
 * All updates reflect immediately in the sidebar without any page refresh.
 */
export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [pictureUrl, setPictureUrl] = useState(user?.picture_url ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inputBase = `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
    theme === 'dark'
      ? 'border-neutral-700 bg-[#1a1a18] text-[#e8e6e1] focus:border-neutral-500'
      : 'border-[#ddd6c8] bg-[#faf7f2] text-[#1a1a1a] focus:border-[#b8b0a5]'
  }`;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    setSaveError(null);
    try {
      const updated = await updateProfile({
        display_name: displayName.trim() || undefined,
        picture_url: pictureUrl.trim() || undefined,
      });
      // Immediately update AuthContext — sidebar reflects the new values without reload
      updateUser({ display_name: updated.display_name, picture_url: updated.picture_url });
      setSaveMsg('Saved.');
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sectionClass = `flex flex-col gap-4 rounded-xl border p-6 ${
    theme === 'dark' ? 'border-neutral-800 bg-[#161614]' : 'border-[#e8e2d6] bg-[#faf7f2]'
  }`;

  return (
    <div className="flex flex-col gap-8 p-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      </header>

      {/* ── Two-column layout: Profile left | Appearance + Account right ── */}
      <div className="flex gap-8 items-start">

        {/* ── LEFT: Profile ──────────────────────────────────────────────── */}
        <section className={sectionClass} style={{ flex: '1 1 0', minWidth: 0 }}>
        <h2 className="text-sm font-medium">Profile</h2>

        {user?.picture_url && (
          <img
            src={user.picture_url}
            alt={user.display_name}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}

        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="displayName" className={`text-xs font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setSaveMsg(null); }}
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="pictureUrl" className={`text-xs font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Profile picture URL
            </label>
            <input
              id="pictureUrl"
              type="url"
              value={pictureUrl}
              onChange={(e) => { setPictureUrl(e.target.value); setSaveMsg(null); }}
              placeholder="https://example.com/avatar.jpg"
              className={inputBase}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                theme === 'dark'
                  ? 'bg-neutral-200 text-neutral-900 hover:bg-white'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700'
              }`}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveMsg && <span className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{saveMsg}</span>}
            {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          </div>
        </form>
        </section>

        {/* ── RIGHT: Appearance + Account stacked ───────────────────────── */}
        <div className="flex flex-col gap-6" style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Appearance */}
          <section className={sectionClass}>
            <h2 className="text-sm font-medium">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Theme</p>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Currently {theme}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-neutral-200 text-neutral-900 hover:bg-white'
                    : 'bg-neutral-900 text-white hover:bg-neutral-700'
                }`}
              >
                Switch to {theme === 'light' ? 'dark' : 'light'}
              </button>
            </div>
          </section>

          {/* Account */}
          <section className={sectionClass}>
            <h2 className="text-sm font-medium">Account</h2>
            <div className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
              <p>Signed in as <strong>{user?.email}</strong></p>
              <p className="mt-2 text-xs leading-relaxed">
                Your journal entries are encrypted in your browser before being stored.
                The server never has access to your plaintext content.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
