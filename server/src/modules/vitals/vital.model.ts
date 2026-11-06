import mongoose, { Document, Schema, Types } from 'mongoose';

export enum VitalMetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_OXYGEN = 'BLOOD_OXYGEN',
  BODY_TEMPERATURE = 'BODY_TEMPERATURE',
}

export enum VitalSource {
  MANUAL = 'MANUAL',
  BLUETOOTH = 'BLUETOOTH',
  HEALTHKIT = 'HEALTHKIT',
  HEALTH_CONNECT = 'HEALTH_CONNECT',
}

export interface IVitalRecordDocument extends Document {
  userId: Types.ObjectId;
  metricType: VitalMetricType;
  value?: number; // Heart Rate (bpm), SpO2 (%), Temp (°C)
  systolic?: number; // Blood pressure systolic (mmHg)
  diastolic?: number; // Blood pressure diastolic (mmHg)
  unit: string;
  source: VitalSource;
  deviceIdentifier?: string;
  measuredAt: Date;
  dateString: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VitalRecordSchema = new Schema<IVitalRecordDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    metricType: {
      type: String,
      enum: Object.values(VitalMetricType),
      required: true,
      index: true,
    },
    value: { type: Number },
    systolic: { type: Number },
    diastolic: { type: Number },
    unit: { type: String, required: true },
    source: {
      type: String,
      enum: Object.values(VitalSource),
      default: VitalSource.MANUAL,
    },
    deviceIdentifier: { type: String },
    measuredAt: { type: Date, required: true, default: Date.now, index: true },
    dateString: { type: String, required: true, index: true },
    notes: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
  }
);

VitalRecordSchema.index({ userId: 1, metricType: 1, measuredAt: -1 });

export const VitalRecord = mongoose.model<IVitalRecordDocument>(
  'VitalRecord',
  VitalRecordSchema
);

