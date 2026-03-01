import { apiClient } from './axiosClient';
import type { AuthResponse } from '@/types/api.types';

/**
 * Send the Google ID token to the backend for verification.
 * The backend verifies the signature, upserts the user, and returns our own JWT.
 */
export async function postGoogleToken(idToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/google', {
    id_token: idToken,
  });
  return response.data;
}
