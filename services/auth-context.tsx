/**
 * AuthContext — provides authentication state and actions to the app.
 * Wraps the entire app to gate authenticated routes.
 *
 * SECURITY — Cross-user data isolation:
 *
 *   The single most important invariant is:
 *     No data belonging to User A must ever be visible during User B's session.
 *
 *   This is enforced by three mechanisms:
 *
 *   1. On app restore (mount): the cached SecureStore profile is only used if
 *      its `id` matches the JWT `sub` from the stored access token
 *      (`AuthStore.getSafeProfile()`). A mismatch wipes the stale cache and
 *      forces a fresh login.
 *
 *   2. On login: before writing User B's data, we atomically:
 *        a. Clear the React Query cache (`queryClient.clear()`)
 *        b. Null out the user state (`setUser(null)`)
 *      Then — and only then — write and display User B's profile. This
 *      eliminates any render window where User A's data is active.
 *
 *   3. On logout: same full clear as (2a) + SecureStore wipe. Nothing of
 *      User A survives to the next session.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore } from './auth-store';
import { clearCachedPin } from './biometrics';
import { authApi, type AuthTokens, type UserProfile, ApiError } from './api';
import { queryClient } from './query-client';
import { clearPendingDeposit } from './wallet-queries';
import { registerForPushNotificationsAsync, unregisterPushDevice } from './push';

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  login:         (data: { phone?: string; email?: string; password: string }) => Promise<void>;
  register:      (data: { phone: string; firstName: string; lastName: string; password: string; email?: string; dateOfBirth?: string; gender?: string }) => Promise<void>;
  logout:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markPinCreated: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Build a UserProfile from the login/register response payload. */
function buildProfile(user: AuthTokens['user']): UserProfile {
  return {
    id:         user.id,
    phone:      user.phone,
    email:      user.email,
    firstName:  user.firstName,
    lastName:   user.lastName,
    dateOfBirth: user.dateOfBirth ?? null,
    gender:     user.gender ?? null,
    role:       user.role,
    kycStatus:  user.kycStatus,
    hasPinSet:  user.hasPinSet ?? false,
    avatarUrl:  user.avatarUrl ?? null,
    isActive:   true,
    createdAt:  user.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Wipe every trace of the current user's data from memory and storage.
 * Called before writing a NEW user's data to guarantee zero cross-user leakage.
 */
async function clearAllUserState(setUser: (u: UserProfile | null) => void) {
  // 1. Synchronously null out React state so no component can render stale data.
  setUser(null);
  // 2. Wipe the React Query in-memory cache (wallet balance, portfolio, etc.)
  queryClient.clear();
  // 3. Remove the pending deposit record (it belongs to the outgoing user).
  await clearPendingDeposit();
  // 4. Drop the biometric-released transaction PIN — it belongs to the
  //    outgoing user and must never survive into another user's session.
  await clearCachedPin();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user,       setUser]       = useState<UserProfile | null>(null);

  // ── App restore ────────────────────────────────────────────────────────────
  // Telegram-style: the restore that gates first paint is LOCAL-ONLY
  // (SecureStore reads, milliseconds). The server profile refresh runs in the
  // background and must never block rendering — gating startup on a network
  // round trip means a slow or dead connection turns into a blank screen.
  useEffect(() => {
    (async () => {
      let cachedHit = false;
      try {
        const hasToken = await AuthStore.isLoggedIn();
        if (!hasToken) return; // No token → stay logged out

        // Load the cached profile ONLY if its ID matches the JWT sub.
        // getSafeProfile() wipes stale data and returns null on mismatch.
        const cached = await AuthStore.getSafeProfile();
        if (cached) {
          cachedHit = true;
          setUser(cached as unknown as UserProfile);
          setIsLoggedIn(true);
        }
      } catch {
        // Storage failure → treat as logged out
      } finally {
        // Local phase complete — the app can paint NOW. (The token-but-no-
        // cache edge case below flips state when the network answers.)
        setIsLoading(false);
      }

      // Background: confirm token validity / refresh the profile. Bounded by
      // the API layer's request timeout, so this settles even on bad networks.
      try {
        const profile = await authApi.getProfile();
        setUser(profile);
        setIsLoggedIn(true);
        await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Token expired / invalid → force logout
          await AuthStore.clear();
          setUser(null);
          setIsLoggedIn(false);
        } else if (!cachedHit) {
          // Network error with no cached identity to fall back on — nothing
          // to render as logged-in; leave the user on the login screen.
        }
        // Network error with cache: keep the safely-loaded cached state.
      }
    })();
  }, []);

  // ── Push permission + token sync ─────────────────────────────────────────
  // The FIRST time a signed-in user reaches the app, ask for notification
  // permission (Android 13+ is deny-by-default, so without an explicit
  // runtime prompt no push token can ever be issued — which meant nobody
  // received pushes at all). The prompt fires exactly ONCE per install; a
  // decline is respected forever, and the Notification Settings screen
  // remains the way to opt in later. Every subsequent login just silently
  // re-syncs the token if permission is already granted.
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(async () => {
      try {
        const PROMPTED_KEY = '@pine_push_prompted';
        const alreadyPrompted = await AsyncStorage.getItem(PROMPTED_KEY);
        if (!alreadyPrompted) {
          await AsyncStorage.setItem(PROMPTED_KEY, 'true');
          await registerForPushNotificationsAsync(true);
        } else {
          await registerForPushNotificationsAsync(false);
        }
      } catch {
        // Push registration is always best-effort.
      }
    }, 1500); // let the first screen settle before the OS dialog appears
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  // ── handleAuthResponse ─────────────────────────────────────────────────────
  // Shared by login() and register(). Atomically swaps from any previous user
  // to the new user — no stale data can flash through between the two states.
  const handleAuthResponse = useCallback(async (result: AuthTokens) => {
    // STEP 1: Atomically clear all previous user data BEFORE writing new data.
    //         This is the critical guard against cross-user leakage on login.
    await clearAllUserState(setUser);

    // STEP 2: Persist the new user's credentials.
    await AuthStore.saveTokens(result.accessToken, result.refreshToken);

    const profile = buildProfile(result.user);
    await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);

    // STEP 3: Mark onboarding complete.
    await AsyncStorage.setItem('@pine_has_onboarded', 'true');

    // STEP 4: Activate the new user in React state.
    setUser(profile);
    setIsLoggedIn(true);
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (data: { phone?: string; email?: string; password: string }) => {
    const result = await authApi.login(data);
    await handleAuthResponse(result);
  }, [handleAuthResponse]);

  // ── register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data: {
    phone: string; firstName: string; lastName: string; password: string; email?: string; dateOfBirth?: string; gender?: string;
  }) => {
    const result = await authApi.register(data);
    await handleAuthResponse(result);
  }, [handleAuthResponse]);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Detach this device's push token first so a logged-out phone stops
    // receiving this user's notifications. Best-effort; never blocks logout.
    await unregisterPushDevice();

    try {
      await authApi.logout();
    } catch {
      // Best effort — clear local state regardless of API response.
    }

    // Wipe everything: React state, query cache, pending deposit, secure storage.
    await clearAllUserState(setUser);
    await AuthStore.clear();
    setIsLoggedIn(false);
  }, []);

  // ── refreshProfile ─────────────────────────────────────────────────────────
  // Called by screens that need to sync KYC status, name, etc. from the server.
  // Validates that the returned profile still belongs to the current user.
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();

      // Guard: the refresh should only update state if the user hasn't changed
      // in the meantime (e.g., logout racing with a pending refresh call).
      setUser((current) => {
        if (!current) return null; // Already logged out — discard the response.
        if (current.id !== profile.id) {
          // The profile response is for a DIFFERENT user — this should never
          // happen in normal operation, but if it does (stale request), we
          // must not apply it.
          console.error(
            '[Auth] refreshProfile: server returned profile for a different user. Discarding.',
            { currentId: current.id, responseId: profile.id },
          );
          return current;
        }
        return profile;
      });

      await AuthStore.saveProfile(profile as unknown as Record<string, unknown>);
    } catch {
      // Silently fail — current user state is unaffected.
    }
  }, []);

  // ── markPinCreated ───────────────────────────────────────────────────────────
  // After the user sets their transaction PIN, flip hasPinSet locally so the
  // mandatory-PIN gate lets them into the app without waiting for a refetch.
  const markPinCreated = useCallback(() => {
    setUser((current) => (current ? { ...current, hasPinSet: true } : current));
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, user, login, register, logout, refreshProfile, markPinCreated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
