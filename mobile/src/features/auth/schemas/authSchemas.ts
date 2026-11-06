import { z } from 'zod';

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

export const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Please enter your registered email or mobile number'),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().default(true),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: passwordValidation,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms and Conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().min(1, 'Please enter your registered email or mobile number'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword: passwordValidation,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

