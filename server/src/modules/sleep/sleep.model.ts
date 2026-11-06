import mongoose, { Document, Schema, Types } from 'mongoose';

export enum SleepQuality {
  VERY_GOOD = 'VERY_GOOD',
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  POOR = 'POOR',
}

export enum SleepSource {
  MANUAL = 'MANUAL',
  WEARABLE = 'WEARABLE',
  DEVICE = 'DEVICE',
}

export interface ISleepRecordDocument extends Document {
  userId: Types.ObjectId;
  bedtime: Date;
  wakeTime: Date;
  durationMinutes: number;
  sleepQuality: SleepQuality;
  source: SleepSource;
  notes?: string;
  dateString: string; // YYYY-MM-DD (typically wake-up date)
  createdAt: Date;
  updatedAt: Date;
}

const SleepRecordSchema = new Schema<ISleepRecordDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bedtime: { type: Date, required: true },
    wakeTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 10, max: 1440 },
    sleepQuality: {
      type: String,
      enum: Object.values(SleepQuality),
      default: SleepQuality.GOOD,
    },
    source: {
      type: String,
      enum: Object.values(SleepSource),
      default: SleepSource.MANUAL,
    },
    notes: { type: String, maxlength: 300 },
    dateString: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

SleepRecordSchema.index({ userId: 1, dateString: 1 });

export const SleepRecord = mongoose.model<ISleepRecordDocument>(
  'SleepRecord',
  SleepRecordSchema
);

