import { apiClient } from '../../../services/api/axiosInstance';
import {
  ApiResponse,
  LoginResponseData,
  RegisterResponseData,
  RefreshTokenResponseData,
  ForgotPasswordResponseData,
  VerifyResetOtpResponseData,
  UserDto,
} from '../../../types/api';

export const authApiService = {
  async register(payload: {
    fullName: string;
    email: string;
    mobileNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  }): Promise<RegisterResponseData> {
    const res = await apiClient.post<ApiResponse<RegisterResponseData>>('/register', payload);
    return res.data.data!;
  },

  async verifyRegistrationOtp(payload: {
    userId: string;
    otp: string;
  }): Promise<{ user: UserDto }> {
    const res = await apiClient.post<ApiResponse<{ user: UserDto }>>('/verify-registration-otp', payload);
    return res.data.data!;
  },

  async resendRegistrationOtp(userId: string): Promise<{ nextResendAllowedIn: number }> {
    const res = await apiClient.post<ApiResponse<{ nextResendAllowedIn: number }>>(
      '/resend-registration-otp',
      { userId }
    );
    return res.data.data!;
  },

  async login(payload: {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>('/login', payload);
    return res.data.data!;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseData> {
    const res = await apiClient.post<ApiResponse<RefreshTokenResponseData>>('/refresh-token', {
      refreshToken,
    });
    return res.data.data!;
  },

  async logout(refreshToken?: string | null): Promise<void> {
    try {
      await apiClient.post('/logout', { refreshToken });
    } catch {
      // Ignore network failures on logout
    }
  },

  async forgotPassword(identifier: string): Promise<ForgotPasswordResponseData> {
    const res = await apiClient.post<ApiResponse<ForgotPasswordResponseData>>('/forgot-password', {
      identifier,
    });
    return res.data.data!;
  },

  async verifyResetOtp(payload: {
    resetSessionId: string;
    otp: string;
  }): Promise<VerifyResetOtpResponseData> {
    const res = await apiClient.post<ApiResponse<VerifyResetOtpResponseData>>('/verify-reset-otp', payload);
    return res.data.data!;
  },

  async resendResetOtp(resetSessionId: string): Promise<void> {
    await apiClient.post('/resend-reset-otp', { resetSessionId });
  },

  async resetPassword(payload: {
    resetAuthToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.post('/reset-password', payload);
  },

  async getMe(): Promise<{ user: UserDto }> {
    const res = await apiClient.get<ApiResponse<{ user: UserDto }>>('/me');
    return res.data.data!;
  },
};

