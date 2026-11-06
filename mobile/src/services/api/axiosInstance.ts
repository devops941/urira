import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { secureStorage } from '../../utils/secureStorage';
import { ApiResponse, RefreshTokenResponseData } from '../../types/api';

const getBaseUrl = (): string => {
  // 1. On Web Browser, always use localhost to prevent LAN IP packet drops & 15s timeouts!
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 2. In Expo Go or mobile development, detect host IP dynamically from Metro packager
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api/v1`;
    }
  }

  let envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.endsWith('/auth')) {
    envUrl = envUrl.replace(/\/auth$/, '');
  }
  if (envUrl && !envUrl.includes('/api/v1')) {
    envUrl = `${envUrl.replace(/\/+$/, '')}/api/v1`;
  }

  // If explicitly configured and not localhost, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Fallback to computer LAN IP
  return envUrl || 'http://localhost:5000/api/v1';
};

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token and route auth endpoints cleanly
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Backward compatibility for authApiService calls without /auth prefix
    if (
      config.url &&
      !config.url.startsWith('/auth') &&
      (config.url.startsWith('/login') ||
        config.url.startsWith('/register') ||
        config.url.startsWith('/verify') ||
        config.url.startsWith('/resend') ||
        config.url.startsWith('/refresh') ||
        config.url.startsWith('/logout') ||
        config.url.startsWith('/forgot') ||
        config.url.startsWith('/reset') ||
        config.url === '/me' ||
        config.url.startsWith('/me/') ||
        config.url.startsWith('/me?'))
    ) {
      config.url = `/auth${config.url}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't loop refresh on login or refresh-token calls themselves
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/login') &&
      !originalRequest.url?.includes('/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly using raw axios to avoid interceptor recursion
        const refreshResponse = await axios.post<ApiResponse<RefreshTokenResponseData>>(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data!;
        await secureStorage.saveTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await secureStorage.clearAuthTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

