import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  email: string;
  isVerified: boolean;
}

export interface ResetTokenPayload {
  sub: string;
  purpose: 'PASSWORD_RESET';
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
  });
};

export const signRefreshToken = (payload: { sub: string }): string => {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { sub: string } => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { sub: string };
};

export const signResetToken = (payload: ResetTokenPayload): string => {
  return jwt.sign(payload, ENV.RESET_PASSWORD_SECRET, {
    expiresIn: ENV.RESET_TOKEN_EXPIRES_IN as any,
  });
};

export const verifyResetToken = (token: string): ResetTokenPayload => {
  return jwt.verify(token, ENV.RESET_PASSWORD_SECRET) as ResetTokenPayload;
};

