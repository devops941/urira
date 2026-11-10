import mongoose, { Document, Schema, Types } from 'mongoose';

export enum FoodCategory {
  FRUITS = 'FRUITS',
  VEGETABLES = 'VEGETABLES',
  GRAINS_CEREALS = 'GRAINS_CEREALS',
  RICE_DISHES = 'RICE_DISHES',
  PULSES_LEGUMES = 'PULSES_LEGUMES',
  DAIRY = 'DAIRY',
  EGGS = 'EGGS',
  MEAT = 'MEAT',
  SEAFOOD = 'SEAFOOD',
  NUTS_SEEDS = 'NUTS_SEEDS',
  BEVERAGES = 'BEVERAGES',
  SNACKS = 'SNACKS',
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  TRADITIONAL_INDIAN = 'TRADITIONAL_INDIAN',
  CUSTOM = 'CUSTOM',
  OTHER = 'OTHER',
}

export enum DietaryTag {
  VEGETARIAN = 'VEGETARIAN',
  NON_VEGETARIAN = 'NON_VEGETARIAN',
  VEGAN = 'VEGAN',
  EGGETARIAN = 'EGGETARIAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  DAIRY_FREE = 'DAIRY_FREE',
  HIGH_PROTEIN = 'HIGH_PROTEIN',
  LOW_CARB = 'LOW_CARB',
}

export interface INutrients {
  calories: number; // kcal
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
}

export interface IFoodServing {
  unit: string; // e.g. "piece", "cup", "bowl", "tbsp", "g", "ml"
  servingSize: number; // multiplier e.g. 1 piece, 1 cup
  weightGrams: number; // weight in grams or ml equivalent
}

export interface IFoodDocument extends Document {
  name: string;
  normalizedName: string;
  category: FoodCategory;
  description: string;
  imageUrl?: string;
  defaultServingSize: number;
  defaultServingUnit: string;
  weightPerDefaultServingGrams: number;
  availableServings: IFoodServing[];
  nutrientsPer100g: INutrients;
  ingredients: string[];
  allergens: string[];
  dietaryTags: DietaryTag[];
  preparationMethod?: string;
  source: string;
  externalFoodId?: string;
  isVerified: boolean;
  isActive: boolean;
  isCustom?: boolean;
  createdBy?: Types.ObjectId;
  favoritedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NutrientsSchema = new Schema<INutrients>(
  {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbohydrates: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ServingSchema = new Schema<IFoodServing>(
  {
    unit: { type: String, required: true },
    servingSize: { type: Number, required: true, min: 0.1 },
    weightGrams: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const FoodSchema = new Schema<IFoodDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    normalizedName: { type: String, required: true, trim: true, lowercase: true, index: true },
    category: {
      type: String,
      enum: Object.values(FoodCategory),
      required: true,
      index: true,
    },
    description: { type: String, default: '' },
    imageUrl: { type: String },
    defaultServingSize: { type: Number, required: true, default: 1 },
    defaultServingUnit: { type: String, required: true, default: 'serving' },
    weightPerDefaultServingGrams: { type: Number, required: true, default: 100 },
    availableServings: [ServingSchema],
    nutrientsPer100g: { type: NutrientsSchema, required: true },
    ingredients: [{ type: String }],
    allergens: [{ type: String, index: true }],
    dietaryTags: [{ type: String, enum: Object.values(DietaryTag), index: true }],
    preparationMethod: { type: String },
    source: { type: String, default: 'ICMR-NIN Indian Food Composition Tables' },
    externalFoodId: { type: String },
    isVerified: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isCustom: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    favoritedBy: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  {
    timestamps: true,
  }
);

FoodSchema.index({ name: 'text', description: 'text', ingredients: 'text' });

export const Food = mongoose.model<IFoodDocument>('Food', FoodSchema);

