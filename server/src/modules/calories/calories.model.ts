import mongoose, { Schema, Document } from 'mongoose';

export type CalorieGoalType = 'MAINTAIN_WEIGHT' | 'LOSE_WEIGHT' | 'GAIN_WEIGHT';
export type CalorieActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';

export interface ICalorieRecord extends Document {
  userId: mongoose.Types.ObjectId;
  age: number;
  biologicalSex: 'MALE' | 'FEMALE';
  heightCm: number;
  weightKg: number;
  activityLevel: CalorieActivityLevel;
  goal: CalorieGoalType;
  bmr: number;
  tdee: number;
  estimatedDailyCalories: number;
  adjustmentKcal: number;
  isPediatricOrSpecial: boolean;
  notes?: string;
  calculatedAt: Date;
  createdAt: Date;
}

const CalorieRecordSchema = new Schema<ICalorieRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    biologicalSex: {
      type: String,
      required: true,
      enum: ['MALE', 'FEMALE'],
    },
    heightCm: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },
    weightKg: {
      type: Number,
      required: true,
      min: 2,
      max: 500,
    },
    activityLevel: {
      type: String,
      required: true,
      enum: ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'],
    },
    goal: {
      type: String,
      required: true,
      enum: ['MAINTAIN_WEIGHT', 'LOSE_WEIGHT', 'GAIN_WEIGHT'],
    },
    bmr: {
      type: Number,
      required: true,
    },
    tdee: {
      type: Number,
      required: true,
    },
    estimatedDailyCalories: {
      type: Number,
      required: true,
    },
    adjustmentKcal: {
      type: Number,
      default: 0,
    },
    isPediatricOrSpecial: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CalorieRecordSchema.index({ userId: 1, calculatedAt: -1 });

export const CalorieRecordModel = mongoose.model<ICalorieRecord>(
  'CalorieRecord',
  CalorieRecordSchema
);

