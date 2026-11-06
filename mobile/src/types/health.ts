export type BiologicalSex = 'MALE' | 'FEMALE' | 'OTHER';
export type PreferredUnit = 'METRIC' | 'IMPERIAL';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHTLY_ACTIVE'
  | 'MODERATELY_ACTIVE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';
export type CalorieActivityLevel = ActivityLevel;
export type HealthGoalPreference =
  | 'MAINTAIN_WEIGHT'
  | 'LOSE_WEIGHT'
  | 'GAIN_WEIGHT'
  | 'GENERAL_WELLNESS';

export interface HealthProfileDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
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
  updatedAt: string;
}

export interface OnboardingPayloadDto {
  dateOfBirth?: string;
  biologicalSex?: BiologicalSex;
  profilePhoto?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  activityLevel?: ActivityLevel;
  healthGoal?: HealthGoalPreference;
  preferredWaterIntakeMl?: number;
  preferredStepGoal?: number;
  preferredSleepGoalHours?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

export type BmiCategory = 'Underweight' | 'Healthy Weight' | 'Overweight' | 'Obesity';

export interface BmiResultDto {
  id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  bmiValue: number;
  category: BmiCategory;
  categoryColor: string;
  isPediatric: boolean;
  userAge?: number;
  unitSystem: PreferredUnit;
  notes?: string;
  disclaimer: string;
  calculatedAt: string;
}

export type CalorieGoalType = 'MAINTAIN_WEIGHT' | 'LOSE_WEIGHT' | 'GAIN_WEIGHT';

export interface CalorieResultDto {
  id: string;
  userId: string;
  age: number;
  biologicalSex: 'MALE' | 'FEMALE';
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: CalorieGoalType;
  bmr: number;
  tdee: number;
  estimatedDailyCalories: number;
  adjustmentKcal: number;
  isPediatricOrSpecial: boolean;
  notes?: string;
  disclaimer: string;
  calculatedAt: string;
}

export type GoalCategory =
  | 'WEIGHT'
  | 'BMI'
  | 'STEPS'
  | 'WATER'
  | 'SLEEP'
  | 'CALORIES'
  | 'HABIT';

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface HealthGoalDto {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  categoryColor: string;
  targetValue: number;
  initialValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  progressPercentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedHistoryItemDto {
  id: string;
  sourceType: 'BMI' | 'CALORIES' | 'GOAL' | 'PROFILE';
  title: string;
  category: string;
  categoryColor: string;
  mainValue: string;
  secondaryDetails: string;
  status?: string;
  timestamp: string;
  rawId: string;
}

// Convenient aliases for UI components
export type BmiRecord = BmiResultDto;
export type CalorieRecord = CalorieResultDto;
export type HealthGoal = HealthGoalDto;
export type UserHealthProfile = HealthProfileDto;
export type UnifiedHistoryItem = UnifiedHistoryItemDto;


