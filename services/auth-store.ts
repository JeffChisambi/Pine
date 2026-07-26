/**
 * Auth token storage.
 *
 * Sensitive credentials (access token, refresh token, user profile) are kept
 * in the OS secure storage:
 *   iOS     → Keychain Services (encrypted, protected by device passcode /
 *             biometrics, hardware-backed on modern iPhones)
 *   Android → EncryptedSharedPreferences backed by Android Keystore
 *
 * This replaces the previous AsyncStorage implementation, which stored tokens
 * in an unencrypted SQLite file readable on rooted devices.
 *
 * The non-sensitive onboarding flag (@pine_has_onboarded) continues to live
 * in AsyncStorage — it carries no credentials and doesn't need protection.
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'pine_access_token',
  REFRESH_TOKEN: 'pine_refresh_token',
  USER_PROFILE: 'pine_user_profile',
} as const;

export const AuthStore = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  async saveProfile(profile: Record<string, unknown>): Promise<void> {
    await SecureStore.setItemAsync(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getProfile(): Promise<Record<string, unknown> | null> {
    const raw = await SecureStore.getItemAsync(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER_PROFILE),
    ]);
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    return !!token;
  },
};
