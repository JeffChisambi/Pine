/**
 * AuthContext — provides authentication state and actions to the app.
 * Wraps the entire app to gate authenticated routes.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore } from './auth-store';
import { authApi, type AuthTokens, type UserProfile, ApiError } from './api';

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (data: { phone?: string; email?: string; password: string }) => Promise<void>;
  register: (data: { phone: string; firstName: string; lastName: string; password: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Check stored auth on mount
  useEffect(() => {
    (async () => {
      try {
        const hasToken = await AuthStore.isLoggedIn();
        if (hasToken) {
          // Try to load cached profile
          const cached = await AuthStore.getProfile();
          if (cached) {
            setUser(cached as unknown as UserProfile);
            setIsLoggedIn(true);
          }

          // Verify token by fetching fresh profile
          try {
            const profile = await authApi.getProfile();
            setUser(profile);
            setIsLoggedIn(true);
            await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);
          } catch (err) {
            // Token expired and refresh failed
            if (err instanceof ApiError && err.status === 401) {
              await AuthStore.clear();
              setIsLoggedIn(false);
              setUser(null);
            }
            // If it's a network error, keep cached state
          }
        }
      } catch {
        // Storage error, treat as not logged in
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAuthResponse = useCallback(async (result: AuthTokens) => {
    await AuthStore.saveTokens(result.accessToken, result.refreshToken);
    const profile: UserProfile = {
      id: result.user.id,
      phone: result.user.phone,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      kycStatus: result.user.kycStatus,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);
    await AsyncStorage.setItem('@pine_has_onboarded', 'true');
    setUser(profile);
    setIsLoggedIn(true);
  }, []);

  const login = useCallback(async (data: { phone?: string; email?: string; password: string }) => {
    const result = await authApi.login(data);
    await handleAuthResponse(result);
  }, [handleAuthResponse]);

  const register = useCallback(async (data: {
    phone: string; firstName: string; lastName: string; password: string; email?: string;
  }) => {
    const result = await authApi.register(data);
    await handleAuthResponse(result);
  }, [handleAuthResponse]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best effort — clear local state regardless
    }
    await AuthStore.clear();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, user, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
