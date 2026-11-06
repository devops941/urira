import mongoose, { Document, Schema, Types } from 'mongoose';

export enum WalkingSessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WalkingSessionSource {
  ANDROID_STEP_COUNTER = 'ANDROID_STEP_COUNTER',
  HEALTH_CONNECT = 'HEALTH_CONNECT',
  CORE_MOTION = 'CORE_MOTION',
  DEVICE = 'DEVICE',
}

export interface IWalkingSessionDocument extends Document {
  userId: Types.ObjectId;
  sessionId: string; // Client-generated UUID for idempotency
  startTime: Date;
  endTime?: Date;
  steps: number;
  distanceMeters: number;
  durationSeconds: number;
  caloriesBurned: number;
  status: WalkingSessionStatus;
  source: WalkingSessionSource;
  notes?: string;
  dateString: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const WalkingSessionSchema = new Schema<IWalkingSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    steps: { type: Number, default: 0, min: 0 },
    distanceMeters: { type: Number, default: 0, min: 0 },
    durationSeconds: { type: Number, default: 0, min: 0 },
    caloriesBurned: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(WalkingSessionStatus),
      default: WalkingSessionStatus.ACTIVE,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(WalkingSessionSource),
      default: WalkingSessionSource.ANDROID_STEP_COUNTER,
    },
    notes: { type: String, maxlength: 300 },
    dateString: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

WalkingSessionSchema.index({ userId: 1, dateString: 1 });
WalkingSessionSchema.index({ userId: 1, status: 1 });

export const WalkingSession = mongoose.model<IWalkingSessionDocument>(
  'WalkingSession',
  WalkingSessionSchema
);

