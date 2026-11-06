import mongoose, { Document, Schema, Types } from 'mongoose';

export enum DietaryType {
  VEGETARIAN = 'VEGETARIAN',
  NON_VEGETARIAN = 'NON_VEGETARIAN',
  EGGETARIAN = 'EGGETARIAN',
  VEGAN = 'VEGAN',
  ANY = 'ANY',
}

export interface IDietPreferenceDocument extends Document {
  userId: Types.ObjectId;
  dietaryType: DietaryType;
  cuisinePreferences: string[];
  foodAllergies: string[];
  excludedFoods: string[];
  dislikedFoods: string[];
  mealsPerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const DietPreferenceSchema = new Schema<IDietPreferenceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    dietaryType: {
      type: String,
      enum: Object.values(DietaryType),
      default: DietaryType.ANY,
    },
    cuisinePreferences: [{ type: String }],
    foodAllergies: [{ type: String }],
    excludedFoods: [{ type: String }],
    dislikedFoods: [{ type: String }],
    mealsPerDay: { type: Number, default: 3, min: 2, max: 6 },
  },
  {
    timestamps: true,
  }
);

export const DietPreference = mongoose.model<IDietPreferenceDocument>(
  'DietPreference',
  DietPreferenceSchema
);

