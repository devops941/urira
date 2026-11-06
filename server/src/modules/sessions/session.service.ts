import crypto from 'crypto';
import { Types } from 'mongoose';
import { sessionRepository, SessionRepository } from './session.repository.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { AppError } from '../../errors/AppError.js';
import { authRepository } from '../auth/auth.repository.js';

export class SessionService {
  constructor(private repo: SessionRepository = sessionRepository) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createSession(
    userId: string,
    email: string,
    isVerified: boolean,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = signAccessToken({
      sub: userId,
      email,
      isVerified,
    });

    const refreshToken = signRefreshToken({ sub: userId });
    const refreshTokenHash = this.hashToken(refreshToken);

    // Refresh token expiry: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.repo.createSession({
      userId: new Types.ObjectId(userId),
      refreshTokenHash,
      deviceInfo,
      ipAddress,
      isValid: true,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(
    oldRefreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const oldHash = this.hashToken(oldRefreshToken);
    const existingSession = await this.repo.findValidSession(payload.sub, oldHash);

    if (!existingSession) {
      // Possible token reuse attack! Invalidate all user sessions
      await this.repo.invalidateAllUserSessions(payload.sub);
      throw new AppError('Session expired or revoked. Please sign in again.', 401);
    }

    // Invalidate old session
    await this.repo.invalidateSession(existingSession._id.toString());

    // Fetch user to verify active status
    const user = await authRepository.findById(payload.sub);
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new AppError('Account is not active', 403);
    }

    // Issue new dual pair
    return this.createSession(
      user._id.toString(),
      user.normalizedEmail,
      user.isVerified,
      existingSession.deviceInfo,
      existingSession.ipAddress
    );
  }

  async revokeSession(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const hash = this.hashToken(refreshToken);
      const session = await this.repo.findValidSession(payload.sub, hash);
      if (session) {
        await this.repo.invalidateSession(session._id.toString());
      }
    } catch {
      // Gracefully finish logout even if token was already expired
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.repo.invalidateAllUserSessions(userId);
  }
}

export const sessionService = new SessionService();

