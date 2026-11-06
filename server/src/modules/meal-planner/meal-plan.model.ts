import mongoose, { Document, Schema, Types } from 'mongoose';
import { MealType } from '../food-logs/food-log.model.js';

export enum MealPlanDuration {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum MealPlanStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface IMealPlanFoodItem {
  foodId: Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface IMealPlanMeal {
  mealType: MealType;
  foods: IMealPlanFoodItem[];
  totalMealCalories: number;
  totalMealProtein: number;
  totalMealCarbs: number;
  totalMealFat: number;
  reason: string;
  preparationNotes?: string;
  isLogged?: boolean;
}

export interface IMealPlanDay {
  dayIndex: number;
  date: string;
  totalDayCalories: number;
  totalDayProtein: number;
  totalDayCarbs: number;
  totalDayFat: number;
  meals: IMealPlanMeal[];
}

export interface IMealRating {
  dayIndex: number;
  mealType: MealType;
  rating: 'LOVED_IT' | 'GOOD' | 'AVERAGE' | 'NOT_PREFERRED';
  comment?: string;
  createdAt: Date;
}

export interface IMealPlanDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  duration: MealPlanDuration;
  startDate: string;
  endDate: string;
  status: MealPlanStatus;
  aiGenerated: boolean;
  days: IMealPlanDay[];
  generalNotes: string[];
  disclaimer: string;
  isTemplate?: boolean;
  templateName?: string;
  ratings?: IMealRating[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanFoodItemSchema = new Schema<IMealPlanFoodItem>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    weightGrams: { type: Number, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true },
  },
  { _id: false }
);

const MealPlanMealSchema = new Schema<IMealPlanMeal>(
  {
    mealType: { type: String, enum: Object.values(MealType), required: true },
    foods: [MealPlanFoodItemSchema],
    totalMealCalories: { type: Number, required: true },
    totalMealProtein: { type: Number, required: true },
    totalMealCarbs: { type: Number, required: true },
    totalMealFat: { type: Number, required: true },
    reason: { type: String, default: '' },
    preparationNotes: { type: String },
    isLogged: { type: Boolean, default: false },
  },
  { _id: false }
);

const MealPlanDaySchema = new Schema<IMealPlanDay>(
  {
    dayIndex: { type: Number, required: true },
    date: { type: String, required: true },
    totalDayCalories: { type: Number, required: true },
    totalDayProtein: { type: Number, required: true },
    totalDayCarbs: { type: Number, required: true },
    totalDayFat: { type: Number, required: true },
    meals: [MealPlanMealSchema],
  },
  { _id: false }
);

const MealPlanSchema = new Schema<IMealPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    duration: {
      type: String,
      enum: Object.values(MealPlanDuration),
      required: true,
      default: MealPlanDuration.DAILY,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(MealPlanStatus),
      required: true,
      default: MealPlanStatus.DRAFT,
      index: true,
    },
    aiGenerated: { type: Boolean, default: true },
    days: [MealPlanDaySchema],
    generalNotes: [{ type: String }],
    disclaimer: {
      type: String,
      default:
        'This AI-generated meal plan is for general informational and wellness purposes. Please consult a qualified clinical dietitian or healthcare professional before making drastic nutritional changes.',
    },
    isTemplate: { type: Boolean, default: false, index: true },
    templateName: { type: String, trim: true },
    ratings: [
      {
        dayIndex: { type: Number, required: true },
        mealType: { type: String, required: true },
        rating: {
          type: String,
          enum: ['LOVED_IT', 'GOOD', 'AVERAGE', 'NOT_PREFERRED'],
          required: true,
        },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

export const MealPlan = mongoose.model<IMealPlanDocument>('MealPlan', MealPlanSchema);

