export const ROUTES = {
  // Public Auth Routes
  WELCOME: '/(auth)/welcome',
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  VERIFY_REGISTRATION_OTP: '/(auth)/verify-registration-otp',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
  VERIFY_RESET_OTP: '/(auth)/verify-reset-otp',
  SET_NEW_PASSWORD: '/(auth)/set-new-password',

  // Protected Routes
  HOME: '/(protected)/home',
} as const;

