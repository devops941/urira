import mongoose, { Document, Schema, Types } from 'mongoose';
import { INutrients } from '../foods/food.model.js';

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  MORNING_SNACK = 'MORNING_SNACK',
  LUNCH = 'LUNCH',
  EVENING_SNACK = 'EVENING_SNACK',
  DINNER = 'DINNER',
  OTHER = 'OTHER',
}

export interface IFoodLogDocument extends Document {
  userId: Types.ObjectId;
  foodId: Types.ObjectId;
  mealType: MealType;
  quantity: number;
  unit: string;
  weightGrams: number;
  calculatedNutrition: INutrients;
  consumedAt: Date;
  dateString: string; // YYYY-MM-DD for fast date indexing
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FoodLogSchema = new Schema<IFoodLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true, index: true },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, required: true },
    weightGrams: { type: Number, required: true, min: 1 },
    calculatedNutrition: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbohydrates: { type: Number, required: true },
      fat: { type: Number, required: true },
      fiber: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
      sodium: { type: Number, default: 0 },
    },
    consumedAt: { type: Date, required: true, default: Date.now, index: true },
    dateString: { type: String, required: true, index: true },
    notes: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
  }
);

FoodLogSchema.index({ userId: 1, dateString: 1, mealType: 1 });

export const FoodLog = mongoose.model<IFoodLogDocument>('FoodLog', FoodLogSchema);

