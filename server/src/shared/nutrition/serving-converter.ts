import { IFoodDocument, IFoodServing, INutrients } from '../../modules/foods/food.model.js';

/**
 * Converts a serving unit and quantity into weight in grams.
 * Matches availableServings configured on the food item or standard unit equivalences.
 */
export function convertToGrams(
  food: {
    weightPerDefaultServingGrams: number;
    defaultServingUnit: string;
    availableServings?: IFoodServing[];
  },
  quantity: number,
  unit: string
): number {
  if (quantity <= 0) return 0;

  const normalizedUnit = unit.trim().toLowerCase();

  // 1. Direct grams / milliliters
  if (normalizedUnit === 'g' || normalizedUnit === 'gram' || normalizedUnit === 'grams') {
    return Math.round(quantity);
  }
  if (normalizedUnit === 'ml' || normalizedUnit === 'milliliter' || normalizedUnit === 'milliliters') {
    // 1ml approx 1g for water/beverages/curries
    return Math.round(quantity);
  }

  // 2. Exact match in food's availableServings
  if (food.availableServings && food.availableServings.length > 0) {
    const match = food.availableServings.find(
      (s) => s.unit.toLowerCase() === normalizedUnit
    );
    if (match) {
      // e.g. match.servingSize = 1 piece = 40g -> quantity = 2 -> 2 * (40 / 1) = 80g
      const gramsPerUnit = match.weightGrams / (match.servingSize || 1);
      return Math.round(quantity * gramsPerUnit);
    }
  }

  // 3. Match default serving unit
  if (food.defaultServingUnit.toLowerCase() === normalizedUnit) {
    return Math.round(quantity * food.weightPerDefaultServingGrams);
  }

  // 4. Standard kitchen approximations if not defined
  switch (normalizedUnit) {
    case 'piece':
    case 'pieces':
      return Math.round(quantity * food.weightPerDefaultServingGrams);
    case 'cup':
    case 'cups':
      return Math.round(quantity * 150); // standard cooked meal cup ~ 150g
    case 'bowl':
    case 'bowls':
      return Math.round(quantity * 200); // standard katori / bowl ~ 200g
    case 'tbsp':
    case 'tablespoon':
    case 'tablespoons':
      return Math.round(quantity * 15);
    case 'tsp':
    case 'teaspoon':
    case 'teaspoons':
      return Math.round(quantity * 5);
    case 'serving':
    case 'servings':
      return Math.round(quantity * food.weightPerDefaultServingGrams);
    default:
      return Math.round(quantity * food.weightPerDefaultServingGrams);
  }
}

