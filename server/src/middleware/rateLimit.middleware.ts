import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 5000,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Disable rate limiting in development or for local development
    if (isDev) return true;
    // Don't rate-limit health check or real-time activity/walking sensor synchronization
    if (
      req.path === '/health' ||
      req.path.startsWith('/api/v1/activity') ||
      req.path.startsWith('/api/v1/walking') ||
      req.path.startsWith('/activity') ||
      req.path.startsWith('/walking')
    ) {
      return true;
    }
    return false;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 50,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 1000 : 15,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

