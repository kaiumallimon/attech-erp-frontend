import Cookies from 'js-cookie';
import {
  AuthLoginResponse,
  AuthMeResponse,
  AuthTokens,
  UserProfile,
  CdnUsageStats,
  CdnResourceItem,
  AuditLogItem,
  AuditStats,
} from '../types/auth';
import { env } from './env';

const API_BASE_URL = env.apiUrl;

export const TOKEN_KEY = 'attech_access_token';
export const REFRESH_TOKEN_KEY = 'attech_refresh_token';

export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const local = localStorage.getItem(TOKEN_KEY);
  if (local) return local;

  const cookieVal = Cookies.get(TOKEN_KEY);
  if (cookieVal) {
    try {
      localStorage.setItem(TOKEN_KEY, cookieVal);
    } catch {}
    return cookieVal;
  }
  return null;
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const local = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (local) return local;

  const cookieVal = Cookies.get(REFRESH_TOKEN_KEY);
  if (cookieVal) {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, cookieVal);
    } catch {}
    return cookieVal;
  }
  return null;
};

export const setStoredTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {}

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  Cookies.set(TOKEN_KEY, tokens.accessToken, {
    expires: 1 / 96, // 15 mins
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
    expires: 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  });
};

export const clearStoredTokens = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
  Cookies.remove(TOKEN_KEY, { path: '/' });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  adminCount: number;
  departmentsCount: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { requiresAuth = true, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);

  if (!headers.has('Content-Type') && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...rest,
    headers,
  });

  // Handle Token Refresh automatically on 401
  if (response.status === 401 && requiresAuth) {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const tokens = refreshData.data?.tokens || refreshData.data;
          if (tokens?.accessToken) {
            setStoredTokens(tokens);
            headers.set('Authorization', `Bearer ${tokens.accessToken}`);
            response = await fetch(url, {
              ...rest,
              headers,
            });
          } else {
            clearStoredTokens();
          }
        } else {
          clearStoredTokens();
        }
      } catch {
        clearStoredTokens();
      }
    } else {
      clearStoredTokens();
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const authApi = {
  login: async (
    emailOrData: string | { email: string; password?: string },
    password?: string
  ): Promise<AuthLoginResponse> => {
    const payload =
      typeof emailOrData === 'string'
        ? { email: emailOrData, password }
        : emailOrData;

    const res = await apiClient<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
    return res.data;
  },

  requestMagicLink: async (email: string) => {
    const res = await apiClient<{ email: string }>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
    return res.data;
  },

  verifyMagicLink: async (token: string): Promise<AuthLoginResponse> => {
    const res = await apiClient<AuthLoginResponse>('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
      requiresAuth: false,
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

  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    const res = await apiClient<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });
    return res.data;
  },
};

export const usersApi = {
  getAll: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await apiClient<UserProfile[]>(`/users?${query.toString()}`);
    return res;
  },

  getStats: async () => {
    const res = await apiClient<UserStats>('/users/stats');
    return res;
  },

  getById: async (id: string) => {
    const res = await apiClient<UserProfile>(`/users/${id}`);
    return res;
  },

  create: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    department?: string;
    jobTitle?: string;
    role?: string;
    phone?: string;
  }) => {
    return apiClient<UserProfile>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      department?: string;
      jobTitle?: string;
      phone?: string;
    }
  ) => {
    return apiClient<UserProfile>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },

  updateRole: async (userId: string, role: string, customPermissions?: string[]) => {
    return apiClient<UserProfile>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, customPermissions }),
    });
  },

  updateStatus: async (userId: string, status: string) => {
    return apiClient<UserProfile>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  uploadAvatar: async (file: File, userId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const endpoint = userId ? `/users/${userId}/avatar` : '/users/me/avatar';
    return apiClient<{ avatarUrl: string; user: UserProfile }>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },

  delete: async (userId: string) => {
    return apiClient<{ deleted: boolean }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  bulkDelete: async (ids: string[]) => {
    return apiClient<{ deletedCount: number }>(`/users/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

export const cdnApi = {
  getUsage: async () => {
    const res = await apiClient<CdnUsageStats>('/cdn/usage');
    return res.data;
  },

  getResources: async (params?: {
    maxResults?: number;
    nextCursor?: string;
    prefix?: string;
    resourceType?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.maxResults) searchParams.set('maxResults', params.maxResults.toString());
    if (params?.nextCursor) searchParams.set('nextCursor', params.nextCursor);
    if (params?.prefix) searchParams.set('prefix', params.prefix);
    if (params?.resourceType && params.resourceType !== 'all') {
      searchParams.set('resourceType', params.resourceType);
    }
    if (params?.search) searchParams.set('search', params.search);

    const qs = searchParams.toString();
    const res = await apiClient<CdnResourceItem[]>(
      `/cdn/resources${qs ? `?${qs}` : ''}`
    );
    return res;
  },

  upload: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const res = await apiClient<CdnResourceItem>(`/cdn/upload${qs}`, {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  delete: async (publicId: string, resourceType: string = 'image') => {
    const res = await apiClient<{ success: boolean; publicId: string }>(
      `/cdn/resources/${publicId}?resourceType=${resourceType}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  },

  bulkDelete: async (publicIds: string[], resourceType: string = 'image') => {
    const res = await apiClient<{ successCount: number; total: number }>(
      `/cdn/bulk-delete?resourceType=${resourceType}`,
      {
        method: 'POST',
        body: JSON.stringify({ publicIds }),
      }
    );
    return res.data;
  },
};

export const auditApi = {
  getLogs: async (params?: {
    search?: string;
    action?: string;
    resource?: string;
    status?: string;
    severity?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.action && params.action !== 'all') searchParams.set('action', params.action);
    if (params?.resource && params.resource !== 'all') searchParams.set('resource', params.resource);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.severity && params.severity !== 'ALL') searchParams.set('severity', params.severity);
    if (params?.ipAddress) searchParams.set('ipAddress', params.ipAddress);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    const res = await apiClient<AuditLogItem[]>(
      `/audit/logs${qs ? `?${qs}` : ''}`
    );
    return res;
  },

  getStats: async () => {
    const res = await apiClient<AuditStats>('/audit/stats');
    return res.data;
  },

  exportLogs: async (format: 'json' | 'csv' = 'json', params?: {
    action?: string;
    resource?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('format', format);
    if (params?.action && params.action !== 'all') searchParams.set('action', params.action);
    if (params?.resource && params.resource !== 'all') searchParams.set('resource', params.resource);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/audit/export?${qs}`;
    const token = getStoredAccessToken();

    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (format === 'csv') {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `security-audit-trail-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    const data = await response.json();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `security-audit-trail-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
