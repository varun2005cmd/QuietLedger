import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from './AuthContext';

/** Renders the Google OAuth sign-in button and handles the credential flow. */
export function GoogleLoginButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(credentialResponse.credential);
      navigate('/', { replace: true });
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {loading ? (
        <div className="text-sm text-neutral-500">Signing in…</div>
      ) : (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in failed.')}
          theme="outline"
          size="large"
          shape="rectangular"
          text="signin_with"
        />
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
