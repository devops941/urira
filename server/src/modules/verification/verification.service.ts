import { Types } from 'mongoose';
import { verificationRepository, VerificationRepository } from './verification.repository.js';
import { generateNumericOtp, hashOtp, compareOtp } from '../../utils/otp.js';
import { sendOtpNotification } from '../../utils/email.js';
import { AppError } from '../../errors/AppError.js';
import { ENV } from '../../config/env.js';
import { OtpPurpose, VerificationChannel } from './verification.types.js';

export class VerificationService {
  constructor(private repo: VerificationRepository = verificationRepository) {}

  async issueOtp(
    userId: string,
    recipient: string,
    purpose: OtpPurpose,
    channel: VerificationChannel = 'EMAIL'
  ): Promise<{ tokenRecordId: string; nextResendAllowedIn: number }> {
    // 1. Check if an active token exists and if cooldown has elapsed
    const existing = await this.repo.findActiveToken(userId, purpose);
    if (existing) {
      const elapsedSeconds = (Date.now() - new Date(existing.lastResentAt).getTime()) / 1000;
      if (elapsedSeconds < ENV.OTP_RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(ENV.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(
          `Please wait ${remaining} seconds before requesting a new verification code`,
          429,
          'OTP_COOLDOWN_ACTIVE'
        );
      }
      // Invalidate previous active tokens for this user & purpose
      await this.repo.invalidatePreviousTokens(userId, purpose);
    }

    // 2. Generate 6-digit numeric OTP and hash it
    const plainOtp = generateNumericOtp(6);
    const otpHash = await hashOtp(plainOtp);
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    // 3. Save to database
    const tokenRecord = await this.repo.createToken({
      userId: new Types.ObjectId(userId),
      purpose,
      channel,
      recipient,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: ENV.MAX_OTP_ATTEMPTS,
      resendCount: existing ? existing.resendCount + 1 : 0,
      lastResentAt: new Date(),
    });

    // 4. Send notification
    await sendOtpNotification(recipient, plainOtp, purpose, channel);

    return {
      tokenRecordId: tokenRecord._id.toString(),
      nextResendAllowedIn: ENV.OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  async verifyOtp(userId: string, otp: string, purpose: OtpPurpose): Promise<void> {
    const token = await this.repo.findActiveToken(userId, purpose);

    if (!token) {
      throw new AppError('Verification code has expired or is invalid. Please request a new one.', 400);
    }

    if (token.attempts >= token.maxAttempts) {
      await this.repo.markAsConsumed(token._id.toString());
      throw new AppError('Maximum verification attempts exceeded. Please request a new code.', 429);
    }

    // Check OTP
    const isMatch = await compareOtp(otp, token.otpHash);
    if (!isMatch) {
      await this.repo.incrementAttempts(token._id.toString());
      const remainingAttempts = token.maxAttempts - (token.attempts + 1);
      throw new AppError(
        `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new code.'}`,
        400
      );
    }

    // Mark as consumed
    await this.repo.markAsConsumed(token._id.toString());
  }

  async verifyOtpById(tokenId: string, otp: string): Promise<{ userId: string; purpose: OtpPurpose }> {
    const token = await this.repo.findTokenById(tokenId);

    if (!token || token.consumedAt || new Date() > token.expiresAt) {
      throw new AppError('Verification code has expired or is invalid. Please request a new one.', 400);
    }

    if (token.attempts >= token.maxAttempts) {
      await this.repo.markAsConsumed(token._id.toString());
      throw new AppError('Maximum verification attempts exceeded. Please request a new code.', 429);
    }

    const isMatch = await compareOtp(otp, token.otpHash);
    if (!isMatch) {
      await this.repo.incrementAttempts(token._id.toString());
      const remainingAttempts = token.maxAttempts - (token.attempts + 1);
      throw new AppError(
        `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new code.'}`,
        400
      );
    }

    await this.repo.markAsConsumed(token._id.toString());
    return {
      userId: token.userId.toString(),
      purpose: token.purpose,
    };
  }
}

export const verificationService = new VerificationService();

