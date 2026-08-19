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
  ApiKeyItem,
  ApiKeyStats,
  CreateApiKeyPayload,
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterStats,
  CreateCampaignPayload,
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
    expires: 1, // 1 day
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

// Decodes JWT exp without external dependency to proactively avoid expired calls
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    // Buffer by 10 seconds to refresh slightly ahead of expiry
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch {
    return false;
  }
};

// Singleton in-flight token refresh promise queue to prevent concurrent race conditions
let refreshPromise: Promise<string | null> | null = null;

export const performTokenRefresh = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearStoredTokens();
    return null;
  }

  refreshPromise = (async () => {
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
          return tokens.accessToken as string;
        }
      }

      // ONLY clear tokens if the backend explicitly rejected the refresh token (401/403)
      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        clearStoredTokens();
      }
      return null;
    } catch {
      // On network error or aborted fetch (e.g. rapid page reload), DO NOT clear tokens!
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
    let token = getStoredAccessToken();
    // Proactively refresh if accessToken is expired
    if (isTokenExpired(token)) {
      const refreshedToken = await performTokenRefresh();
      if (refreshedToken) {
        token = refreshedToken;
      }
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  let response = await fetch(url, {
    ...rest,
    headers,
  });

  // Handle Token Refresh automatically on 401 using mutex queue
  if (response.status === 401 && requiresAuth) {
    const newAccessToken = await performTokenRefresh();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, {
        ...rest,
        headers,
      });
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

export const apiKeysApi = {
  list: async (params?: {
    search?: string;
    status?: string;
    scope?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.scope && params.scope !== 'all') searchParams.set('scope', params.scope);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const qs = searchParams.toString();
    const res = await apiClient<ApiKeyItem[]>(`/api-keys${qs ? `?${qs}` : ''}`);
    return res;
  },

  getStats: async () => {
    const res = await apiClient<ApiKeyStats>('/api-keys/stats');
    return res.data;
  },

  create: async (payload: CreateApiKeyPayload) => {
    const res = await apiClient<{ apiKey: ApiKeyItem; rawSecret: string }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'REVOKED') => {
    const res = await apiClient<ApiKeyItem>(`/api-keys/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  regenerateSecret: async (id: string) => {
    const res = await apiClient<{ apiKey: ApiKeyItem; rawSecret: string }>(
      `/api-keys/${id}/regenerate-secret`,
      {
        method: 'POST',
      }
    );
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient<{ id: string }>(`/api-keys/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

export const publicApi = {
  subscribeNewsletter: async (
    apiKey: string,
    apiSecret: string,
    email: string,
    source: string = 'website'
  ) => {
    const response = await fetch(`${API_BASE_URL}/public/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify({ email, source }),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Newsletter subscription failed');
    }
    return json;
  },

  getCareers: async (apiKey: string, apiSecret: string) => {
    const response = await fetch(`${API_BASE_URL}/public/careers`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Failed to fetch careers');
    }
    return json;
  },

  applyCareer: async (
    apiKey: string,
    apiSecret: string,
    data: {
      jobId: string;
      fullName: string;
      email: string;
      portfolioUrl?: string;
      resumeUrl?: string;
      coverLetter?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/public/careers/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'X-API-SECRET': apiSecret,
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Career application failed');
    }
    return json;
  },
};

export const newsletterApi = {
  getStats: async () => {
    const res = await apiClient<NewsletterStats>('/newsletter/stats');
    return res.data;
  },

  listCampaigns: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const qs = searchParams.toString();
    const res = await apiClient<NewsletterCampaign[]>(`/newsletter/campaigns${qs ? `?${qs}` : ''}`);
    return res;
  },

  getCampaign: async (id: string) => {
    const res = await apiClient<NewsletterCampaign>(`/newsletter/campaigns/${id}`);
    return res.data;
  },

  createCampaign: async (payload: CreateCampaignPayload) => {
    const res = await apiClient<NewsletterCampaign>('/newsletter/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  sendTestEmail: async (campaignId: string, recipientEmail: string) => {
    const res = await apiClient<{ id: string; recipient: string }>(
      `/newsletter/campaigns/${campaignId}/send-test`,
      {
        method: 'POST',
        body: JSON.stringify({ recipientEmail }),
      }
    );
    return res;
  },

  broadcastCampaign: async (campaignId: string) => {
    const res = await apiClient<NewsletterCampaign>(
      `/newsletter/campaigns/${campaignId}/broadcast`,
      {
        method: 'POST',
      }
    );
    return res;
  },

  deleteCampaign: async (campaignId: string) => {
    const res = await apiClient<{ id: string }>(`/newsletter/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  listSubscribers: async (params?: {
    search?: string;
    source?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.source && params.source !== 'all') searchParams.set('source', params.source);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const qs = searchParams.toString();
    const res = await apiClient<NewsletterSubscriber[]>(
      `/newsletter/subscribers${qs ? `?${qs}` : ''}`
    );
    return res;
  },

  addSubscriber: async (payload: { email: string; name?: string; source?: string; tags?: string[] }) => {
    const res = await apiClient<NewsletterSubscriber>('/newsletter/subscribers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteSubscriber: async (id: string) => {
    const res = await apiClient<{ id: string }>(`/newsletter/subscribers/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

export const crmApi = {
  getStats: async () => {
    const res = await apiClient<import('../types/crm').CrmStats>('/crm/stats');
    return res.data;
  },

  getLeads: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    service?: string;
    budgetRange?: string;
    priority?: string;
    search?: string;
    assignedTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.service && params.service !== 'ALL') searchParams.set('service', params.service);
    if (params?.budgetRange && params.budgetRange !== 'ALL') searchParams.set('budgetRange', params.budgetRange);
    if (params?.priority && params.priority !== 'ALL') searchParams.set('priority', params.priority);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.assignedTo && params.assignedTo !== 'ALL') searchParams.set('assignedTo', params.assignedTo);

    const qs = searchParams.toString();
    const res = await apiClient<any>(`/crm/leads${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    return { data: items as import('../types/crm').CrmLead[], meta: res.meta || res.data?.meta };
  },

  getLeadById: async (id: string) => {
    const res = await apiClient<
      import('../types/crm').CrmLead & {
        activities: import('../types/crm').CrmActivity[];
        proposals: import('../types/crm').CrmProposal[];
      }
    >(`/crm/leads/${id}`);
    return res.data;
  },

  createLead: async (payload: Partial<import('../types/crm').CrmLead>) => {
    const res = await apiClient<import('../types/crm').CrmLead>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateLead: async (id: string, payload: Partial<import('../types/crm').CrmLead>) => {
    const res = await apiClient<import('../types/crm').CrmLead>(`/crm/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateLeadStage: async (id: string, stage: string, note?: string) => {
    const res = await apiClient<import('../types/crm').CrmLead>(`/crm/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, note }),
    });
    return res.data;
  },

  convertLeadToClient: async (id: string, payload: { companyName?: string; industry?: string; tier?: string; initialContractValue?: number; billingEmail?: string }) => {
    const res = await apiClient<{ client: import('../types/crm').CrmClient; lead: import('../types/crm').CrmLead }>(`/crm/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  logActivity: async (id: string, payload: { type: string; title: string; content?: string }) => {
    const res = await apiClient<import('../types/crm').CrmActivity>(`/crm/leads/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getClients: async (params?: { page?: number; limit?: number; search?: string; tier?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tier && params.tier !== 'ALL') searchParams.set('tier', params.tier);

    const qs = searchParams.toString();
    const res = await apiClient<any>(`/crm/clients${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    return { data: items as import('../types/crm').CrmClient[], meta: res.meta || res.data?.meta };
  },

  createProposal: async (payload: any) => {
    const res = await apiClient<import('../types/crm').CrmProposal>('/crm/proposals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};

export const projectsApi = {
  getStats: async () => {
    const res = await apiClient<import('../types/projects').ProjectsStats>('/projects/stats');
    return res.data;
  },

  getProjects: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    clientId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.type && params.type !== 'ALL') searchParams.append('type', params.type);
    if (params?.clientId && params.clientId !== 'ALL') searchParams.append('clientId', params.clientId);
    if (params?.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    const res = await apiClient<any>(`/projects${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    return { data: items as import('../types/projects').Project[], meta: res.meta || res.data?.meta };
  },

  getProjectById: async (id: string) => {
    const res = await apiClient<import('../types/projects').Project>(`/projects/${id}`);
    return res.data;
  },

  createProject: async (payload: any) => {
    const res = await apiClient<import('../types/projects').Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateProject: async (id: string, payload: any) => {
    const res = await apiClient<import('../types/projects').Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  addRevision: async (id: string, payload: { title: string; description?: string; amount: number; autoInvoice?: boolean }) => {
    const res = await apiClient<import('../types/projects').Project>(`/projects/${id}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  createSprint: async (payload: any) => {
    const res = await apiClient<import('../types/projects').Sprint>('/projects/sprints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  createTask: async (payload: any) => {
    const res = await apiClient<import('../types/projects').Task>('/projects/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateTask: async (id: string, payload: any) => {
    const res = await apiClient<import('../types/projects').Task>(`/projects/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateTaskStatus: async (id: string, status: string) => {
    const res = await apiClient<import('../types/projects').Task>(`/projects/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },
};

export const invoicingApi = {
  getStats: async () => {
    const res = await apiClient<import('../types/invoicing').InvoicingStats>('/invoices/stats');
    return res.data;
  },

  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    isRevision?: string;
    clientId?: string;
    projectId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.type && params.type !== 'ALL') searchParams.append('type', params.type);
    if (params?.isRevision !== undefined && params.isRevision !== 'ALL') searchParams.append('isRevision', params.isRevision);
    if (params?.clientId && params.clientId !== 'ALL') searchParams.append('clientId', params.clientId);
    if (params?.projectId && params.projectId !== 'ALL') searchParams.append('projectId', params.projectId);
    if (params?.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    const res = await apiClient<any>(`/invoices${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
      ? res.data.data
      : [];
    return { data: items as import('../types/invoicing').Invoice[], meta: res.meta || res.data?.meta };
  },

  getInvoiceById: async (id: string) => {
    const res = await apiClient<import('../types/invoicing').Invoice>(`/invoices/${id}`);
    return res.data;
  },

  createInvoice: async (payload: any) => {
    const res = await apiClient<import('../types/invoicing').Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  generateInstallments: async (payload: any) => {
    const res = await apiClient<import('../types/invoicing').Invoice[]>('/invoices/installments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  recordPayment: async (id: string, payload: any) => {
    const res = await apiClient<{ invoice: import('../types/invoicing').Invoice; payment: import('../types/invoicing').PaymentRecord }>(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  sendInvoiceEmail: async (id: string) => {
    const res = await apiClient<{ message: string }>(`/invoices/${id}/send-email`, {
      method: 'POST',
    });
    return res.data;
  },
};


