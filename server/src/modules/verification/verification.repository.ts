import { VerificationTokenModel } from './verification.model.js';
import { IVerificationToken, IVerificationTokenDocument, OtpPurpose } from './verification.types.js';

export class VerificationRepository {
  async createToken(tokenData: Partial<IVerificationToken>): Promise<IVerificationTokenDocument> {
    const token = new VerificationTokenModel(tokenData);
    return token.save();
  }

  async findActiveToken(
    userId: string,
    purpose: OtpPurpose
  ): Promise<IVerificationTokenDocument | null> {
    return VerificationTokenModel.findOne({
      userId,
      purpose,
      consumedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('+otpHash');
  }

  async findTokenById(id: string): Promise<IVerificationTokenDocument | null> {
    return VerificationTokenModel.findById(id).select('+otpHash');
  }

  async incrementAttempts(tokenId: string): Promise<void> {
    await VerificationTokenModel.findByIdAndUpdate(tokenId, {
      $inc: { attempts: 1 },
    });
  }

  async markAsConsumed(tokenId: string): Promise<void> {
    await VerificationTokenModel.findByIdAndUpdate(tokenId, {
      $set: { consumedAt: new Date() },
    });
  }

  async invalidatePreviousTokens(userId: string, purpose: OtpPurpose): Promise<void> {
    await VerificationTokenModel.updateMany(
      { userId, purpose, consumedAt: { $exists: false } },
      { $set: { consumedAt: new Date() } }
    );
  }
}

export const verificationRepository = new VerificationRepository();

