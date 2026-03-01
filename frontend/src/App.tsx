import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CryptoProvider } from '@/crypto/CryptoContext';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppShell } from '@/components/Layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { JournalPage } from '@/pages/JournalPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';

const GOOGLE_CLIENT_ID =
  (import.meta.env['VITE_GOOGLE_CLIENT_ID'] as string | undefined) ?? '';

/**
 * Provider order (outermost → innermost):
 * 1. GoogleOAuthProvider — wraps the whole app so @react-oauth/google can work anywhere
 * 2. CryptoProvider     — initializes the AES key once; must wrap AuthProvider
 *                         so that login-triggered actions have crypto available
 * 3. AuthProvider       — depends on Zustand journalStore.clear (no extra deps)
 * 4. BrowserRouter      — routing
 */
export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CryptoProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — all share the AppShell layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<JournalPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </CryptoProvider>
    </GoogleOAuthProvider>
  );
}
