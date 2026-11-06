import { UserModel } from '../users/user.model.js';
import { IUser, IUserDocument } from '../users/user.types.js';

export class AuthRepository {
  async findByNormalizedEmail(normalizedEmail: string): Promise<IUserDocument | null> {
    if (!normalizedEmail) return null;
    return UserModel.findOne({ normalizedEmail }).select('+passwordHash');
  }

  async findByNormalizedMobile(normalizedMobileNumber?: string): Promise<IUserDocument | null> {
    if (!normalizedMobileNumber) return null;
    return UserModel.findOne({ normalizedMobileNumber }).select('+passwordHash');
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).select('+passwordHash');
  }

  async findByIdPublic(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  async findByIdentifier(identifier: string): Promise<IUserDocument | null> {
    const cleaned = identifier.trim().toLowerCase();
    return UserModel.findOne({
      $or: [
        { normalizedEmail: cleaned },
        { normalizedMobileNumber: identifier.trim() },
      ],
    }).select('+passwordHash');
  }

  async createUser(userData: Partial<IUser>): Promise<IUserDocument> {
    const user = new UserModel(userData);
    return user.save();
  }

  async markAsVerified(userId: string): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          isVerified: true,
          accountStatus: 'ACTIVE',
          failedLoginAttempts: 0,
          lockUntil: undefined,
        },
      },
      { new: true }
    );
  }

  async updatePassword(userId: string, passwordHash: string): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordHash,
          failedLoginAttempts: 0,
          lockUntil: undefined,
        },
      },
      { new: true }
    );
  }

  async incrementFailedLogin(userId: string, lockUntil?: Date): Promise<void> {
    const update: any = { $inc: { failedLoginAttempts: 1 } };
    if (lockUntil) {
      update.$set = { lockUntil, accountStatus: 'LOCKED' };
    }
    await UserModel.findByIdAndUpdate(userId, update);
  }

  async resetFailedLogin(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $set: { failedLoginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });
  }
}

export const authRepository = new AuthRepository();

