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
 *
 * SECURITY — Cross-user isolation:
 *   `getUserIdFromToken()` decodes the JWT sub claim (no crypto verification —
 *   that is the backend's job). It is used only to cross-check the cached
 *   profile ID against the stored access token so we never show User A's
 *   profile data under User B's session.
 */
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN:  'pine_access_token',
  REFRESH_TOKEN: 'pine_refresh_token',
  USER_PROFILE:  'pine_user_profile',
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

  /**
   * Decode the `sub` claim from the stored JWT access token WITHOUT verifying
   * the signature (verification is the backend's responsibility).
   *
   * Used only for cross-checking the cached profile identity so we never
   * render one user's data under another user's session.
   *
   * Returns `null` if there is no token or it cannot be decoded.
   */
  async getUserIdFromToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Base64url → Base64 → JSON
      const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const padded = payload.padEnd(
        payload.length + (4 - (payload.length % 4)) % 4,
        '=',
      );
      const decoded = JSON.parse(
        Buffer.from(padded, 'base64').toString('utf-8'),
      ) as { sub?: string; id?: string };

      return decoded.sub ?? decoded.id ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Load the cached profile ONLY if its `id` matches the user ID embedded in
   * the stored access token.
   *
   * Returns `null` (and clears stale data) when a mismatch is detected —
   * this prevents User A's cached profile from being shown during User B's
   * session restore.
   */
  async getSafeProfile(): Promise<Record<string, unknown> | null> {
    const [profileRaw, tokenUserId] = await Promise.all([
      SecureStore.getItemAsync(KEYS.USER_PROFILE),
      this.getUserIdFromToken(),
    ]);

    if (!profileRaw) return null;

    let profile: Record<string, unknown>;
    try {
      profile = JSON.parse(profileRaw);
    } catch {
      // Corrupt cache — wipe it
      await SecureStore.deleteItemAsync(KEYS.USER_PROFILE);
      return null;
    }

    // If we can extract the token user ID, verify it matches the cached profile.
    if (tokenUserId && profile.id && profile.id !== tokenUserId) {
      // Mismatch — stale cache from a different user. Clear it immediately.
      console.warn(
        '[AuthStore] Cached profile ID does not match token sub. Clearing stale cache.',
        { profileId: profile.id, tokenUserId },
      );
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.USER_PROFILE),
        SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      ]);
      return null;
    }

    return profile;
  },
};
