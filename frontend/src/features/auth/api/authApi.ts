import { apiClient } from '@/lib/api';
import type {
  LoginRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
  TokenResponseDto,
  UserDto,
} from '@/types/api';

export const authApi = {
  login: (credentials: LoginRequestDto) =>
    apiClient.post<TokenResponseDto>('/auth/login', credentials, { authenticated: false }),

  register: (payload: RegisterRequestDto) =>
    apiClient.post<RegisterResponseDto>('/auth/register', payload, { authenticated: false }),

  fetchCurrentUser: (signal?: AbortSignal) => apiClient.get<UserDto>('/auth/me', { signal }),

  logout: () => apiClient.post<undefined>('/auth/logout'),

  refreshSession: () => apiClient.refreshSession(),
};
