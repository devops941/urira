import mongoose, { Document, Schema, Types } from 'mongoose';

export enum MedicationType {
  TABLET = 'TABLET',
  CAPSULE = 'CAPSULE',
  SYRUP = 'SYRUP',
  LIQUID = 'LIQUID',
  DROPS = 'DROPS',
  INJECTION = 'INJECTION',
  OTHER = 'OTHER',
}

export enum MedicationFrequency {
  ONCE_DAILY = 'ONCE_DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THRICE_DAILY = 'THRICE_DAILY',
  AS_NEEDED = 'AS_NEEDED',
  CUSTOM = 'CUSTOM',
}

export enum DoseStatus {
  TAKEN = 'TAKEN',
  SKIPPED = 'SKIPPED',
  SNOOZED = 'SNOOZED',
  MISSED = 'MISSED',
  PENDING = 'PENDING',
}

export interface IMedicationDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  type: MedicationType;
  strength?: string;
  instructions?: string;
  frequency: MedicationFrequency;
  scheduledTimes: string[]; // ["08:00", "20:00"]
  startDate: string;
  endDate?: string;
  reminderEnabled: boolean;
  alarmEnabled?: boolean;
  prescriber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicationDoseEventDocument extends Document {
  userId: Types.ObjectId;
  medicationId: Types.ObjectId;
  scheduledTime: string;
  dateString: string;
  status: DoseStatus;
  actionRecordedAt: Date;
  notes?: string;
  createdAt: Date;
}

const MedicationSchema = new Schema<IMedicationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(MedicationType),
      default: MedicationType.TABLET,
    },
    strength: { type: String },
    instructions: { type: String, maxlength: 300 },
    frequency: {
      type: String,
      enum: Object.values(MedicationFrequency),
      default: MedicationFrequency.ONCE_DAILY,
    },
    scheduledTimes: [{ type: String, required: true }],
    startDate: { type: String, required: true },
    endDate: { type: String },
    reminderEnabled: { type: Boolean, default: true },
    alarmEnabled: { type: Boolean, default: false },
    prescriber: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

const MedicationDoseEventSchema = new Schema<IMedicationDoseEventDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    medicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
      index: true,
    },
    scheduledTime: { type: String, required: true },
    dateString: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(DoseStatus),
      default: DoseStatus.PENDING,
    },
    actionRecordedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

MedicationDoseEventSchema.index(
  { userId: 1, medicationId: 1, dateString: 1, scheduledTime: 1 },
  { unique: true }
);

export const Medication = mongoose.model<IMedicationDocument>(
  'Medication',
  MedicationSchema
);

export const MedicationDoseEvent = mongoose.model<IMedicationDoseEventDocument>(
  'MedicationDoseEvent',
  MedicationDoseEventSchema
);

