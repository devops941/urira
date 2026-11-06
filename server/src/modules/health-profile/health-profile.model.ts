import mongoose, { Schema, Document } from 'mongoose';

export type BiologicalSex = 'MALE' | 'FEMALE' | 'OTHER';
export type PreferredUnit = 'METRIC' | 'IMPERIAL';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';
export type HealthGoalPreference =
  | 'MAINTAIN_WEIGHT'
  | 'LOSE_WEIGHT'
  | 'GAIN_WEIGHT'
  | 'GENERAL_WELLNESS';

export interface IHealthProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  biologicalSex?: BiologicalSex;
  profilePhoto?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  preferredUnit: PreferredUnit;
  activityLevel: ActivityLevel;
  healthGoal: HealthGoalPreference;
  preferredWaterIntakeMl: number;
  preferredStepGoal: number;
  preferredSleepGoalHours: number;
  preferredDailyCalorieGoal?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  completionPercentage: number;
  isOnboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HealthProfileSchema = new Schema<IHealthProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    biologicalSex: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    heightCm: {
      type: Number,
      min: 30,
      max: 300,
    },
    weightKg: {
      type: Number,
      min: 2,
      max: 500,
    },
    targetWeightKg: {
      type: Number,
      min: 2,
      max: 500,
    },
    preferredUnit: {
      type: String,
      enum: ['METRIC', 'IMPERIAL'],
      default: 'METRIC',
    },
    activityLevel: {
      type: String,
      enum: ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'],
    },
    healthGoal: {
      type: String,
      enum: ['MAINTAIN_WEIGHT', 'LOSE_WEIGHT', 'GAIN_WEIGHT', 'GENERAL_WELLNESS'],
    },
    preferredWaterIntakeMl: {
      type: Number,
      default: 2500,
      min: 500,
      max: 10000,
    },
    preferredStepGoal: {
      type: Number,
      default: 8000,
      min: 1000,
      max: 100000,
    },
    preferredSleepGoalHours: {
      type: Number,
      default: 8,
      min: 4,
      max: 16,
    },
    preferredDailyCalorieGoal: {
      type: Number,
      min: 500,
      max: 10000,
    },
    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 25,
    },
    medicalNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isOnboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const HealthProfileModel = mongoose.model<IHealthProfile>(
  'HealthProfile',
  HealthProfileSchema
);

