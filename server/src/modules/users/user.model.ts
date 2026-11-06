import { Schema, model } from 'mongoose';
import { IUserDocument } from './user.types.js';

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: String,
      required: false,
      trim: true,
    },
    normalizedMobileNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    profilePhoto: {
      type: String,
      required: false,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevents leaking passwordHash in queries
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationChannel: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      default: 'EMAIL',
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'PENDING_VERIFICATION', 'LOCKED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.normalizedEmail;
        delete ret.normalizedMobileNumber;
        return ret;
      },
    },
  }
);

export const UserModel = model<IUserDocument>('User', UserSchema);

