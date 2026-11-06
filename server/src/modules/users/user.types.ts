import { Document, Types } from 'mongoose';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type AccountStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'LOCKED' | 'SUSPENDED';
export type VerificationChannel = 'EMAIL' | 'SMS';

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  normalizedEmail: string;
  mobileNumber?: string;
  normalizedMobileNumber?: string;
  dateOfBirth?: Date;
  gender: Gender;
  profilePhoto?: string;
  passwordHash: string;
  isVerified: boolean;
  verificationChannel: VerificationChannel;
  accountStatus: AccountStatus;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;

export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  gender: Gender;
  isVerified: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
}

