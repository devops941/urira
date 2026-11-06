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
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  MORNING_SNACK = 'MORNING_SNACK',
  LUNCH = 'LUNCH',
  EVENING_SNACK = 'EVENING_SNACK',
  DINNER = 'DINNER',
  OTHER = 'OTHER',
}

export interface INutrients {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface IFoodServing {
  unit: string;
  servingSize: number;
  weightGrams: number;
}

export interface IFood {
  _id: string;
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
  dietaryTags: string[];
  preparationMethod?: string;
  source: string;
  isVerified: boolean;
  favoritedBy?: string[];
}

export interface IFoodLog {
  _id: string;
  userId: string;
  foodId: IFood;
  mealType: MealType;
  quantity: number;
  unit: string;
  weightGrams: number;
  calculatedNutrition: INutrients;
  consumedAt: string;
  dateString: string;
  notes?: string;
}

export interface IMealBreakdown {
  breakfast: number;
  morningSnack: number;
  lunch: number;
  eveningSnack: number;
  dinner: number;
  other: number;
}

export interface INutritionSummary {
  _id?: string;
  date: string;
  calorieTarget: number;
  consumedCalories: number;
  remainingCalories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  mealBreakdown: IMealBreakdown;
}

export interface IDietSuggestionItem {
  foodId: string;
  name: string;
  category: string;
  serving: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  reason: string;
  dietaryTags: string[];
  allergens: string[];
}

export interface ISmartAlternative {
  original: string;
  substitute: string;
  caloriesDiff: string;
  fiberBenefit: string;
  reason: string;
}

export interface IDietSuggestionsResponse {
  dietaryPreference: string;
  activeAllergens: string[];
  highProtein: IDietSuggestionItem[];
  highFiber: IDietSuggestionItem[];
  meals: {
    breakfast: IDietSuggestionItem[];
    lunch: IDietSuggestionItem[];
    dinner: IDietSuggestionItem[];
    snacks: IDietSuggestionItem[];
  };
  alternatives: ISmartAlternative[];
}

export interface IMealPlanFoodItem {
  foodId: string;
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

export interface IMealPlan {
  _id: string;
  title: string;
  duration: 'DAILY' | 'WEEKLY';
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  aiGenerated: boolean;
  days: IMealPlanDay[];
  generalNotes: string[];
  disclaimer: string;
  isTemplate?: boolean;
  templateName?: string;
  tags?: string[];
  ratings?: Array<{
    dayIndex: number;
    mealType: MealType;
    rating: 'LOVED_IT' | 'GOOD' | 'AVERAGE' | 'NOT_PREFERRED';
    comment?: string;
    ratedAt: string;
  }>;
}

