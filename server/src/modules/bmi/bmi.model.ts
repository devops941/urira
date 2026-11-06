import mongoose, { Schema, Document } from 'mongoose';

export type BmiCategory = 'Underweight' | 'Healthy Weight' | 'Overweight' | 'Obesity';

export interface IBMIRecord extends Document {
  userId: mongoose.Types.ObjectId;
  heightCm: number;
  weightKg: number;
  bmiValue: number;
  category: BmiCategory;
  categoryColor: string;
  isPediatric: boolean;
  userAge?: number;
  unitSystem: 'METRIC' | 'IMPERIAL';
  notes?: string;
  calculatedAt: Date;
  createdAt: Date;
}

const BMIRecordSchema = new Schema<IBMIRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    bmiValue: {
      type: Number,
      required: true,
      min: 5,
      max: 150,
    },
    category: {
      type: String,
      required: true,
      enum: ['Underweight', 'Healthy Weight', 'Overweight', 'Obesity'],
    },
    categoryColor: {
      type: String,
      default: '#16A34A',
    },
    isPediatric: {
      type: Boolean,
      default: false,
    },
    userAge: {
      type: Number,
    },
    unitSystem: {
      type: String,
      enum: ['METRIC', 'IMPERIAL'],
      default: 'METRIC',
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

// Compound index for querying user's history in descending chronological order
BMIRecordSchema.index({ userId: 1, calculatedAt: -1 });

export const BMIRecordModel = mongoose.model<IBMIRecord>('BMIRecord', BMIRecordSchema);

