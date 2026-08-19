import Cookies from 'js-cookie';
import { AuthLoginResponse, AuthMeResponse, AuthTokens, UserProfile } from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const TOKEN_KEY = 'attech_access_token';
export const REFRESH_TOKEN_KEY = 'attech_refresh_token';

export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || Cookies.get(TOKEN_KEY) || null;
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || Cookies.get(REFRESH_TOKEN_KEY) || null;
};

export const setStoredTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  Cookies.set(TOKEN_KEY, tokens.accessToken, { expires: 7, secure: false, sameSite: 'lax' });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 7, secure: false, sameSite: 'lax' });
};

export const clearStoredTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const resJson = await response.json().catch(() => ({
    success: false,
    message: 'Failed to parse response',
  }));

  if (!response.ok) {
    // If token expired, try refreshing
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.data?.accessToken) {
              setStoredTokens(refreshData.data);
              // Retry original request
              headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              return retryRes.json();
            }
          }
        } catch {
          clearStoredTokens();
        }
      }
    }

    const errorMessage = Array.isArray(resJson.message)
      ? resJson.message.join(', ')
      : resJson.message || 'An unexpected error occurred';

    throw new Error(errorMessage);
  }

  return resJson;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthLoginResponse> => {
    const res = await apiClient<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data;
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    department?: string;
    jobTitle?: string;
    role?: string;
  }): Promise<{ user: UserProfile; tokens: AuthTokens }> => {
    const res = await apiClient<{ user: UserProfile; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.data;
  },

  getMe: async (): Promise<AuthMeResponse> => {
    const res = await apiClient<AuthMeResponse>('/auth/me', {
      method: 'GET',
    });
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      clearStoredTokens();
    }
  },
};

export const usersApi = {
  getAll: async (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await apiClient<UserProfile[]>(`/users?${query.toString()}`);
    return res;
  },

  updateRole: async (userId: string, role: string, customPermissions?: string[]) => {
    return apiClient(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, customPermissions }),
    });
  },

  updateStatus: async (userId: string, status: string) => {
    return apiClient(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
