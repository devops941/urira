import { INutrients } from '../../modules/foods/food.model.js';

/**
 * Calculates exact nutritional values for a given weight in grams
 * Formula: (Nutrient per 100g * Consumed Weight in Grams) / 100
 */
export function calculateNutrientsForWeight(
  nutrientsPer100g: INutrients,
  weightGrams: number
): INutrients {
  if (weightGrams <= 0) {
    return {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };
  }

  const factor = weightGrams / 100;

  return {
    calories: Math.round(nutrientsPer100g.calories * factor),
    protein: roundTo1Dec(nutrientsPer100g.protein * factor),
    carbohydrates: roundTo1Dec(nutrientsPer100g.carbohydrates * factor),
    fat: roundTo1Dec(nutrientsPer100g.fat * factor),
    fiber: roundTo1Dec((nutrientsPer100g.fiber || 0) * factor),
    sugar: roundTo1Dec((nutrientsPer100g.sugar || 0) * factor),
    sodium: Math.round((nutrientsPer100g.sodium || 0) * factor),
  };
}

/**
 * Aggregates an array of nutrients into a single total
 */
export function aggregateNutrients(nutrientList: INutrients[]): INutrients {
  return nutrientList.reduce(
    (acc, curr) => ({
      calories: acc.calories + (curr.calories || 0),
      protein: roundTo1Dec(acc.protein + (curr.protein || 0)),
      carbohydrates: roundTo1Dec(acc.carbohydrates + (curr.carbohydrates || 0)),
      fat: roundTo1Dec(acc.fat + (curr.fat || 0)),
      fiber: roundTo1Dec(acc.fiber + (curr.fiber || 0)),
      sugar: roundTo1Dec(acc.sugar + (curr.sugar || 0)),
      sodium: Math.round(acc.sodium + (curr.sodium || 0)),
    }),
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    }
  );
}

function roundTo1Dec(num: number): number {
  return Math.round(num * 10) / 10;
}

