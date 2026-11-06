import { Document, Types } from 'mongoose';

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  isValid: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export type ISessionDocument = ISession & Document;

