import { Schema, model } from 'mongoose';
import { IVerificationTokenDocument } from './verification.types.js';

const VerificationTokenSchema = new Schema<IVerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'PASSWORD_RESET'],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: MongoDB auto-removes expired records
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResentAt: {
      type: Date,
      default: Date.now,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active tokens
VerificationTokenSchema.index({ userId: 1, purpose: 1, consumedAt: 1 });

export const VerificationTokenModel = model<IVerificationTokenDocument>(
  'VerificationToken',
  VerificationTokenSchema
);

