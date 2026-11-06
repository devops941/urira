export enum ActivitySource {
  MANUAL = 'MANUAL',
  PEDOMETER = 'PEDOMETER',
  HEALTHKIT = 'HEALTHKIT',
  HEALTH_CONNECT = 'HEALTH_CONNECT',
  DEVICE = 'DEVICE',
}

export interface IActivityRecord {
  _id: string;
  id?: string;
  userId: string;
  activityType: string;
  steps: number;
  distanceKm: number;
  activeDurationMinutes: number;
  estimatedCalories: number;
  source: ActivitySource;
  deviceIdentifier?: string;
  dateString: string;
  recordedAt: string;
  notes?: string;
}

export interface IActivityTodaySummary {
  date: string;
  totalSteps: number;
  stepGoal: number;
  targetSteps?: number;
  remainingSteps: number;
  progressPercentage: number;
  totalDistanceKm: number;
  distanceKm?: number;
  totalActiveMinutes: number;
  totalCalories: number;
  caloriesBurned?: number;
  recordCount: number;
  records: IActivityRecord[];
}

export interface IWeeklyActivityDay {
  date: string;
  steps: number;
  distanceKm: number;
  calories: number;
  goal: number;
  goalReached: boolean;
}

export interface IWeeklyActivity {
  startDate: string;
  endDate: string;
  stepGoal: number;
  totalWeeklySteps: number;
  avgDailySteps: number;
  history: IWeeklyActivityDay[];
}

// --- Water ---
export enum BeverageType {
  WATER = 'WATER',
  TEA = 'TEA',
  COFFEE = 'COFFEE',
  TEA_COFFEE = 'TEA_COFFEE',
  JUICE = 'JUICE',
  ELECTROLYTE = 'ELECTROLYTE',
  OTHER = 'OTHER',
}

export interface IWaterLog {
  _id: string;
  id?: string;
  userId: string;
  quantityMl: number;
  amountMl?: number;
  beverageType: BeverageType;
  beverageName?: string;
  dateString: string;
  recordedAt: string;
  loggedAt?: string;
  notes?: string;
}

export interface IWaterTodaySummary {
  date: string;
  targetMl: number;
  totalWaterMl: number;
  plainWaterMl?: number;
  otherBeveragesMl: number;
  totalConsumedMl: number;
  totalAmountMl?: number;
  remainingMl: number;
  excessMl: number;
  progressRatio: number;
  progressPercentage: number;
  isGoalAchieved?: boolean;
  reminderEnabled: boolean;
  reminderIntervalMinutes: number;
  entriesCount: number;
  logs: IWaterLog[];
}

export interface IWeeklyWater {
  startDate: string;
  endDate: string;
  targetMl: number;
  totalConsumedMl: number;
  avgDailyMl: number;
  history: Array<{
    date: string;
    consumedMl: number;
    targetMl: number;
    achieved: boolean;
  }>;
}

// --- Sleep ---
export enum SleepQuality {
  VERY_GOOD = 'VERY_GOOD',
  GOOD = 'GOOD',
  AVERAGE = 'AVERAGE',
  POOR = 'POOR',
}

export interface ISleepRecord {
  _id: string;
  id?: string;
  userId: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  sleepQuality: SleepQuality;
  quality?: SleepQuality | string;
  efficiencyScore?: number;
  source: string;
  notes?: string;
  dateString: string;
  date?: string;
}

export interface ISleepLatestResponse {
  hasRecord: boolean;
  sleepGoalHours: number;
  durationHours?: number;
  goalPercentage?: number;
  latest: ISleepRecord | null;
}

// --- Medication ---
export enum MedicationType {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  LIQUID = 'LIQUID',
  DROPS = 'DROPS',
  INJECTION = 'INJECTION',
  OTHER = 'OTHER',
}

export enum DoseStatus {
  TAKEN = 'TAKEN',
  SKIPPED = 'SKIPPED',
  SNOOZED = 'SNOOZED',
  MISSED = 'MISSED',
  PENDING = 'PENDING',
}

export interface IMedication {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  type: MedicationType;
  formType?: MedicationType;
  strength?: string;
  dosage?: string;
  instructions?: string;
  foodInstruction?: string;
  frequency: string;
  scheduledTimes: string[];
  startDate: string;
  endDate?: string;
  reminderEnabled: boolean;
  alarmEnabled?: boolean;
  prescriber?: string;
  isActive: boolean;
}

export interface ITodayMedicationDose {
  medicationId: string;
  name: string;
  type: string;
  strength?: string;
  dosage?: string;
  instructions?: string;
  foodInstruction?: string;
  scheduledTime: string;
  alarmEnabled?: boolean;
  status: DoseStatus;
}

export interface ITodayMedicationSchedule {
  date: string;
  totalScheduled: number;
  takenCount: number;
  adherencePercentage: number;
  doses: ITodayMedicationDose[];
}

// --- Vitals ---
export enum VitalMetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_OXYGEN = 'BLOOD_OXYGEN',
  BODY_TEMPERATURE = 'BODY_TEMPERATURE',
}

export interface IVitalRecord {
  _id: string;
  id?: string;
  userId: string;
  metricType: VitalMetricType;
  type?: VitalMetricType | string;
  value?: number;
  heartRate?: number;
  systolic?: number;
  bloodPressureSystolic?: number;
  diastolic?: number;
  bloodPressureDiastolic?: number;
  bloodOxygen?: number;
  bodyTemperatureCelsius?: number;
  unit: string;
  source: string;
  measuredAt: string;
  recordedAt?: string;
  notes?: string;
}

export interface IVitalsLatestSnapshot {
  heartRate: { value: number; unit: string; measuredAt: string; recordedAt?: string; source: string } | null;
  bloodPressure: { systolic: number; diastolic: number; unit: string; measuredAt: string; recordedAt?: string; source: string } | null;
  bloodOxygen: { value: number; unit: string; measuredAt: string; recordedAt?: string; source: string } | null;
  temperature: { value: number; valueCelsius?: number; unit: string; measuredAt: string; recordedAt?: string; source: string } | null;
  bodyTemperature?: { value: number; valueCelsius?: number; unit: string; measuredAt: string; recordedAt?: string; source: string } | null;
}

// --- Wellness Insights ---
export interface IWellnessInsightResponse {
  summary: string;
  observations: Array<{ category: string; message: string }>;
  suggestions: Array<{ title: string; description: string; category: string }>;
  disclaimer: string;
}

// Convenient Type Aliases for UI Components
export type DailyStepSummaryDto = IActivityTodaySummary;
export type DailyWaterSummaryDto = IWaterTodaySummary;
export type WaterLogDto = IWaterLog;
export type SleepRecordDto = ISleepRecord;
export type MedicationDto = IMedication;
export type MedicationFormType = MedicationType;
export type MedicationFrequency = string;
export type FoodInstruction = string;
export type TodayDoseItemDto = ITodayMedicationDose;
export type VitalRecordDto = IVitalRecord;
export type VitalType = VitalMetricType;
export type LatestVitalsDto = IVitalsLatestSnapshot;
export type WellnessInsightDto = {
  overallScore?: number;
  summary: string;
  recommendations?: string[];
  observations?: Array<{ category: string; message: string }>;
  suggestions?: Array<{ title: string; description: string; category: string }>;
  disclaimer?: string;
};

