import mongoose, { Document, Schema, Types } from 'mongoose';

export enum BeverageType {
  WATER = 'WATER',
  TEA_COFFEE = 'TEA_COFFEE',
  JUICE = 'JUICE',
  ELECTROLYTE = 'ELECTROLYTE',
  OTHER = 'OTHER',
}

export interface IWaterLogDocument extends Document {
  userId: Types.ObjectId;
  quantityMl: number;
  beverageType: BeverageType;
  dateString: string; // YYYY-MM-DD
  recordedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaterGoalDocument extends Document {
  userId: Types.ObjectId;
  targetMl: number;
  reminderEnabled: boolean;
  reminderIntervalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quantityMl: { type: Number, required: true, min: 10, max: 5000 },
    beverageType: {
      type: String,
      enum: Object.values(BeverageType),
      default: BeverageType.WATER,
    },
    dateString: { type: String, required: true, index: true },
    recordedAt: { type: Date, required: true, default: Date.now },
    notes: { type: String, maxlength: 200 },
  },
  {
    timestamps: true,
  }
);

WaterLogSchema.index({ userId: 1, dateString: 1 });

const WaterGoalSchema = new Schema<IWaterGoalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    targetMl: { type: Number, required: true, default: 2500, min: 500, max: 10000 },
    reminderEnabled: { type: Boolean, default: true },
    reminderIntervalMinutes: { type: Number, default: 90, min: 30, max: 360 },
  },
  {
    timestamps: true,
  }
);

export const WaterLog = mongoose.model<IWaterLogDocument>('WaterLog', WaterLogSchema);
export const WaterGoal = mongoose.model<IWaterGoalDocument>('WaterGoal', WaterGoalSchema);

