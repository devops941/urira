export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  isVerified: boolean;
  accountStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'SUSPENDED';
  createdAt: string;
}

export interface LoginResponseData {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponseData {
  userId: string;
  recipient: string;
  channel: string;
  nextResendAllowedIn: number;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordResponseData {
  resetSessionId: string;
}

export interface VerifyResetOtpResponseData {
  resetAuthToken: string;
}

