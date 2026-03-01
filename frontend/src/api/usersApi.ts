import { apiClient } from './axiosClient';
import type { ProfileUpdateRequest } from '@/types/api.types';
import type { User } from '@/types/auth.types';

/** Update the user's display name and/or picture URL. Returns the updated user object. */
export async function updateProfile(data: ProfileUpdateRequest): Promise<User> {
  const response = await apiClient.put<User>('/users/profile', data);
  return response.data;
}
