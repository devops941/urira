import { Document, Types } from 'mongoose';

export type OtpPurpose = 'REGISTRATION' | 'PASSWORD_RESET';
export type VerificationChannel = 'EMAIL' | 'SMS';

export interface IVerificationToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: OtpPurpose;
  channel: VerificationChannel;
  recipient: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastResentAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

export type IVerificationTokenDocument = IVerificationToken & Document;

