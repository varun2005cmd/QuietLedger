import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { GoogleLoginButton } from '@/auth/GoogleLoginButton';
import { useSettingsStore } from '@/store/settingsStore';

/** Public login page. Redirects to / if already authenticated. */
export function LoginPage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const theme = useSettingsStore((s) => s.theme);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`flex h-screen flex-col items-center justify-center gap-8 ${theme === 'dark' ? 'bg-[#111110]' : 'bg-[#f5f2eb]'}`}>
      {/* Logo + tagline */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className={`text-2xl font-semibold tracking-tight ${theme === 'dark' ? 'text-[#e8e6e1]' : 'text-[#1a1a1a]'}`}>
          QuietLedger
        </h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Private journaling. Your words, encrypted.
        </p>
      </div>

      {/* Sign in card */}
      <div className={`flex flex-col items-center gap-5 rounded-2xl border px-10 py-8 ${theme === 'dark' ? 'border-neutral-800 bg-[#161614]' : 'border-[#e8e2d6] bg-[#faf7f2] shadow-sm'}`}>
        <p className={`text-xs leading-relaxed text-center max-w-xs ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Sign in with Google to continue. Your entries are encrypted locally before being saved.
        </p>

        <GoogleLoginButton />

        <div className="flex items-center gap-3 w-full">
          <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-neutral-800' : 'bg-[#ddd6c8]'}`} />
          <span className={`text-xs ${theme === 'dark' ? 'text-neutral-600' : 'text-neutral-400'}`}>or</span>
          <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-neutral-800' : 'bg-[#ddd6c8]'}`} />
        </div>

        <button
          onClick={demoLogin}
          className={`w-full rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
            theme === 'dark'
              ? 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300'
              : 'border-[#ddd6c8] text-neutral-500 hover:border-[#c8bfb2] hover:text-neutral-700'
          }`}
        >
          Preview without login
        </button>
      </div>

      {/* Footer note */}
      <p className={`text-xs ${theme === 'dark' ? 'text-neutral-700' : 'text-neutral-300'}`}>
        No tracking. No ads. No noise.
      </p>
    </div>
  );
}
