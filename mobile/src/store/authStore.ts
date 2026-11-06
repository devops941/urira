import { create } from 'zustand';
import { UserDto } from '../types/api';
import { secureStorage } from '../utils/secureStorage';
import { authApiService } from '../features/auth/services/authService';
import { profileService } from '../services/health/profileService';
import { extractApiErrorMessage } from '../services/api/apiErrorHandler';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initAuth: () => Promise<void>;
  setUser: (user: UserDto | null) => void;
  updateUser: (partial: Partial<UserDto>) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  initAuth: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getRefreshToken(),
      ]);

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken, isLoading: true });
        try {
          const { user } = await authApiService.getMe();
          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });

          // Pre-fetch health profile photo if missing on user object
          if (!user?.profilePhoto) {
            profileService.getProfile().then((prof) => {
              if (prof?.profilePhoto) {
                get().updateUser({ profilePhoto: prof.profilePhoto });
              }
            }).catch(() => {});
          }
          return;
        } catch {
          // Token may be invalid or expired; clear tokens
          await secureStorage.clearAuthTokens();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
          return;
        }
      }

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      set({ isInitialized: true, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  updateUser: (partial) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    }));
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await secureStorage.saveTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  login: async (identifier: string, password: string, rememberMe: boolean = true) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApiService.login({ identifier, password, rememberMe });
      await secureStorage.saveTokens(response.accessToken, response.refreshToken);
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      if (!response.user?.profilePhoto) {
        profileService.getProfile().then((prof) => {
          if (prof?.profilePhoto) {
            get().updateUser({ profilePhoto: prof.profilePhoto });
          }
        }).catch(() => {});
      }
    } catch (err) {
      const errorMessage = extractApiErrorMessage(err, 'Failed to log in. Please check your credentials.');
      set({ isLoading: false, error: errorMessage });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = get().refreshToken;
      await authApiService.logout(refreshToken);
    } catch {
      // Continue cleanup on client
    } finally {
      await secureStorage.clearAuthTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

