/**
 * axiosClient.ts
 *
 * Configured Axios instance used by ALL API modules.
 * - Attaches JWT Bearer token to every request automatically.
 * - On 401 response: clears stored credentials and redirects to /login.
 *
 * UI components never import axios directly — they use the typed API modules.
 */

import axios from 'axios';

const BASE_URL = import.meta.env['VITE_API_BASE_URL'] as string | undefined ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject Bearer token ──────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ql_jwt');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Skip redirect in demo mode (demo_token is never a real JWT)
      const token = localStorage.getItem('ql_jwt');
      if (token !== 'demo_token') {
        localStorage.removeItem('ql_jwt');
        localStorage.removeItem('ql_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
