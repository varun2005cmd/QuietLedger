import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Wraps private routes. Redirects unauthenticated users to /login. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
