import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { authLimiter, otpLimiter } from '../../middleware/rateLimit.middleware.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resendResetOtpSchema,
  resetPasswordSchema,
} from './auth.validation.js';

const router = Router();

// Registration
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/verify-registration-otp',
  otpLimiter,
  validateBody(verifyOtpSchema),
  authController.verifyRegistrationOtp
);

router.post(
  '/resend-registration-otp',
  otpLimiter,
  validateBody(resendOtpSchema),
  authController.resendRegistrationOtp
);

// Login & Session
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/refresh-token',
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  authController.logout
);

// Password Recovery
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/verify-reset-otp',
  otpLimiter,
  validateBody(verifyResetOtpSchema),
  authController.verifyResetOtp
);

router.post(
  '/resend-reset-otp',
  otpLimiter,
  validateBody(resendResetOtpSchema),
  authController.resendResetOtp
);

router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

// Current User Profile
router.get(
  '/me',
  requireAuth,
  authController.getCurrentUser
);

export const authRoutes = router;

