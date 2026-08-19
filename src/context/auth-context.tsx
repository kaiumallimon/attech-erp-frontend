'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, RbacInfo, Role } from '../types/auth';
import {
  authApi,
  getStoredAccessToken,
  getStoredRefreshToken,
  performTokenRefresh,
  isTokenExpired,
  setStoredTokens,
  clearStoredTokens,
} from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  rbac: RbacInfo | null;
  role: Role | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<{ email: string }>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rbac, setRbac] = useState<RbacInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    let token = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    // If access token is missing or expired but refresh token exists, proactively rotate tokens!
    if ((!token || isTokenExpired(token)) && refreshToken) {
      const refreshed = await performTokenRefresh();
      if (refreshed) {
        token = refreshed;
      }
    }

    if (!token) {
      setUser(null);
      setRbac(null);
      setIsLoading(false);
      return;
    }

    try {
      const meData = await authApi.getMe();
      setUser(meData.user);
      setRbac(meData.rbac);
    } catch (err: any) {
      // ONLY clear tokens and reset session if server returned explicit 401 Unauthorized,
      // NOT if the request was aborted by rapid page reloads or temporary network glitch!
      const errorMsg = String(err?.message || '').toLowerCase();
      const isExplicitAuthFailure =
        errorMsg.includes('401') ||
        errorMsg.includes('unauthorized') ||
        errorMsg.includes('token is invalid') ||
        errorMsg.includes('has expired');

      if (isExplicitAuthFailure) {
        clearStoredTokens();
        setUser(null);
        setRbac(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setStoredTokens(res.tokens);
      setUser(res.user);
      const meData = await authApi.getMe();
      setRbac(meData.rbac);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const requestMagicLink = async (email: string) => {
    return await authApi.requestMagicLink(email);
  };

  const verifyMagicLink = async (token: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyMagicLink(token);
      setStoredTokens(res.tokens);
      setUser(res.user);
      const meData = await authApi.getMe();
      setRbac(meData.rbac);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout regardless
    } finally {
      clearStoredTokens();
      setUser(null);
      setRbac(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const role = user?.role || null;
  const isAdmin = Boolean(rbac?.isAdmin || role === Role.SUPER_ADMIN || role === Role.ADMIN);
  const isSuperAdmin = Boolean(rbac?.isSuperAdmin || role === Role.SUPER_ADMIN);
  const isAuthenticated = Boolean(user && getStoredAccessToken());

  return (
    <AuthContext.Provider
      value={{
        user,
        rbac,
        role,
        isAdmin,
        isSuperAdmin,
        isAuthenticated,
        isLoading,
        login,
        requestMagicLink,
        verifyMagicLink,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
