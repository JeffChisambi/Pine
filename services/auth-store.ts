/**
 * Auth token storage using AsyncStorage.
 * Stores access and refresh tokens persistently.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: 'pine_access_token',
  REFRESH_TOKEN: 'pine_refresh_token',
  USER_PROFILE: 'pine_user_profile',
} as const;

export const AuthStore = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS_TOKEN, accessToken],
      [KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async saveProfile(profile: Record<string, unknown>): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getProfile(): Promise<Record<string, unknown> | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER_PROFILE,
    ]);
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
    return !!token;
  },
};
