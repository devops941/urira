import { SessionModel } from './session.model.js';
import { ISession, ISessionDocument } from './session.types.js';

export class SessionRepository {
  async createSession(sessionData: Partial<ISession>): Promise<ISessionDocument> {
    const session = new SessionModel(sessionData);
    return session.save();
  }

  async findValidSession(userId: string, refreshTokenHash: string): Promise<ISessionDocument | null> {
    return SessionModel.findOne({
      userId,
      refreshTokenHash,
      isValid: true,
      expiresAt: { $gt: new Date() },
    });
  }

  async invalidateSession(id: string): Promise<void> {
    await SessionModel.findByIdAndUpdate(id, { $set: { isValid: false } });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await SessionModel.updateMany({ userId }, { $set: { isValid: false } });
  }
}

export const sessionRepository = new SessionRepository();

