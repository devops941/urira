import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Please enter a valid mobile number with country code (e.g. +919876543210)')
      .optional(),
    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Please provide a valid date of birth (YYYY-MM-DD)',
      })
      .optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms and Conditions to register' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Please enter your registered email or mobile number'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3, 'Please enter your registered email or mobile number'),
});

export const verifyResetOtpSchema = z.object({
  resetSessionId: z.string().min(1, 'Reset session identifier is required'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export const resendResetOtpSchema = z.object({
  resetSessionId: z.string().min(1, 'Reset session identifier is required'),
});

export const resetPasswordSchema = z
  .object({
    resetAuthToken: z.string().min(1, 'Reset authorization token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

