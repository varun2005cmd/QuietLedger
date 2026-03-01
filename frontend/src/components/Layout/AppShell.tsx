import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useSettingsStore } from '@/store/settingsStore';

const navItems = [
  { to: '/', label: 'Journal', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

/** Animated light/dark toggle pill */
function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const dark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
        transition-colors duration-300 ease-in-out focus:outline-none
        ${dark ? 'bg-neutral-600' : 'bg-neutral-300'}
      `}
    >
      {/* sliding circle */}
      <span
        className={`
          pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow
          transition-transform duration-300 ease-in-out
          ${dark ? 'translate-x-[22px]' : 'translate-x-[3px]'}
        `}
      />
      {/* sun icon (visible in light mode) */}
      <span
        className={`absolute left-[4px] text-[10px] leading-none transition-opacity duration-300 ${
          dark ? 'opacity-0' : 'opacity-60'
        }`}
        aria-hidden
      >
        ☀
      </span>
      {/* moon icon (visible in dark mode) */}
      <span
        className={`absolute right-[4px] text-[10px] leading-none transition-opacity duration-300 ${
          dark ? 'opacity-60' : 'opacity-0'
        }`}
        aria-hidden
      >
        ☾
      </span>
    </button>
  );
}

/** Persistent application shell with sidebar navigation. */
export function AppShell() {
  const { user, logout } = useAuth();
  const theme = useSettingsStore((s) => s.theme);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#111110] text-[#e8e6e1]' : 'bg-[#f5f2eb] text-[#1a1a1a]'}`}>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`flex w-52 shrink-0 flex-col border-r px-4 py-8 ${theme === 'dark' ? 'border-neutral-800' : 'border-[#ddd6c8]'}`}>
        {/* Logo */}
        <div className="mb-10 px-2">
          <Link to="/" className="text-lg font-semibold tracking-tight hover:opacity-75 transition-opacity">
            QuietLedger
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-neutral-800 font-medium'
                      : 'bg-[#e3ddd3] font-medium'
                    : theme === 'dark'
                    ? 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    : 'text-neutral-500 hover:bg-[#e3ddd3] hover:text-neutral-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info + logout */}
        {user && (
          <div className="flex flex-col gap-3 px-1">
            <div className="flex items-center gap-2">
              {user.picture_url ? (
                <img
                  src={user.picture_url}
                  alt={user.display_name}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${theme === 'dark' ? 'bg-neutral-700' : 'bg-[#ddd6c8]'}`}>
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs truncate max-w-[100px]">{user.display_name}</span>
            </div>
            <button
              onClick={logout}
              className={`text-left text-xs px-3 py-1.5 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                  : 'text-neutral-400 hover:bg-[#e3ddd3] hover:text-neutral-600'
              }`}
            >
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with theme toggle */}
        <div className={`flex shrink-0 items-center justify-end px-6 py-2.5 border-b ${
          theme === 'dark' ? 'border-neutral-800' : 'border-[#e8e2d6]'
        }`}>
          <ThemeToggle />
        </div>
        <main className="flex flex-1 flex-col overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
