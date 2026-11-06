import { Gender, VerificationChannel } from '../users/user.types.js';

export interface RegisterDto {
  fullName: string;
  email: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface VerifyOtpDto {
  userId: string;
  otp: string;
}

export interface ResendOtpDto {
  userId: string;
}

export interface LoginDto {
  identifier: string; // email or mobileNumber
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  identifier: string;
}

export interface VerifyResetOtpDto {
  resetSessionId: string;
  otp: string;
}

export interface ResendResetOtpDto {
  resetSessionId: string;
}

export interface ResetPasswordDto {
  resetAuthToken: string;
  newPassword: string;
  confirmPassword: string;
}

