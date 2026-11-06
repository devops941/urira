import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ActivitySource {
  MANUAL = 'MANUAL',
  PEDOMETER = 'PEDOMETER',
  HEALTHKIT = 'HEALTHKIT',
  HEALTH_CONNECT = 'HEALTH_CONNECT',
  DEVICE = 'DEVICE',
}

export interface IActivityRecordDocument extends Document {
  userId: Types.ObjectId;
  activityType: string;
  steps: number;
  distanceKm: number;
  activeDurationMinutes: number;
  estimatedCalories: number;
  source: ActivitySource;
  deviceIdentifier?: string;
  dateString: string; // YYYY-MM-DD
  recordedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityRecordSchema = new Schema<IActivityRecordDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: { type: String, default: 'WALKING' },
    steps: { type: Number, required: true, min: 0 },
    distanceKm: { type: Number, default: 0, min: 0 },
    activeDurationMinutes: { type: Number, default: 0, min: 0 },
    estimatedCalories: { type: Number, default: 0, min: 0 },
    source: {
      type: String,
      enum: Object.values(ActivitySource),
      default: ActivitySource.MANUAL,
    },
    deviceIdentifier: { type: String },
    dateString: { type: String, required: true, index: true },
    recordedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
  }
);

ActivityRecordSchema.index({ userId: 1, dateString: 1 });

export const ActivityRecord = mongoose.model<IActivityRecordDocument>(
  'ActivityRecord',
  ActivityRecordSchema
);

