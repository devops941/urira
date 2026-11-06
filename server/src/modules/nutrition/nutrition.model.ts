import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMealBreakdown {
  breakfast: number;
  morningSnack: number;
  lunch: number;
  eveningSnack: number;
  dinner: number;
  other: number;
}

export interface INutritionSummaryDocument extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  calorieTarget: number;
  consumedCalories: number;
  remainingCalories: number;
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  mealBreakdown: IMealBreakdown;
  createdAt: Date;
  updatedAt: Date;
}

const NutritionSummarySchema = new Schema<INutritionSummaryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    calorieTarget: { type: Number, required: true, default: 2000 },
    consumedCalories: { type: Number, required: true, default: 0 },
    remainingCalories: { type: Number, required: true, default: 2000 },
    protein: { type: Number, required: true, default: 0 },
    carbohydrates: { type: Number, required: true, default: 0 },
    fat: { type: Number, required: true, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    mealBreakdown: {
      breakfast: { type: Number, default: 0 },
      morningSnack: { type: Number, default: 0 },
      lunch: { type: Number, default: 0 },
      eveningSnack: { type: Number, default: 0 },
      dinner: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

NutritionSummarySchema.index({ userId: 1, date: 1 }, { unique: true });

export const NutritionSummary = mongoose.model<INutritionSummaryDocument>(
  'NutritionSummary',
  NutritionSummarySchema
);

