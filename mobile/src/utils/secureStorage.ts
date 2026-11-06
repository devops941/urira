import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'uyira_access_token',
  REFRESH_TOKEN: 'uyira_refresh_token',
  REMEMBER_ME: 'uyira_remember_me',
  USER_DATA: 'uyira_user_data',
} as const;

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (error) {
      console.warn(`Failed to securely save key: ${key}`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Failed to retrieve key: ${key}`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.warn(`Failed to delete key: ${key}`, error);
    }
  },

  // Token Helpers
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      this.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
  },

  KEYS: STORAGE_KEYS,
};

