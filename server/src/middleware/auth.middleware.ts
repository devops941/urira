import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. No bearer token provided.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    if (!payload.isVerified) {
      sendError(res, 'Your account is not verified. Please verify your account first.', 403);
      return;
    }
    req.user = payload as any;
    next();
  } catch (error) {
    sendError(res, 'Session expired or invalid token. Please sign in again.', 401);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyAccessToken(token);
      req.user = payload as any;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

