import mongoose, { Schema, Document } from 'mongoose';

export type GoalCategory =
  | 'WEIGHT'
  | 'BMI'
  | 'STEPS'
  | 'WATER'
  | 'SLEEP'
  | 'CALORIES'
  | 'HABIT';

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface IHealthGoal extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: GoalCategory;
  targetValue: number;
  initialValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  progressPercentage: number;
  notes?: string;
  categoryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

const HealthGoalSchema = new Schema<IHealthGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      enum: ['WEIGHT', 'BMI', 'STEPS', 'WATER', 'SLEEP', 'CALORIES', 'HABIT'],
      index: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    initialValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    categoryColor: {
      type: String,
      default: '#16A34A',
    },
  },
  {
    timestamps: true,
  }
);

HealthGoalSchema.index({ userId: 1, status: 1, targetDate: 1 });

export const HealthGoalModel = mongoose.model<IHealthGoal>('HealthGoal', HealthGoalSchema);

