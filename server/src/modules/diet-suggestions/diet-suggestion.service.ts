import { Food, IFoodDocument, DietaryTag } from '../foods/food.model.js';
import { DietPreferenceService } from '../diet-preferences/diet-preference.service.js';
import { DietaryType } from '../diet-preferences/diet-preference.model.js';
import { calculateNutrientsForWeight } from '../../shared/nutrition/nutrient-calculator.js';

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

export class DietSuggestionService {
  private prefService: DietPreferenceService;

  constructor() {
    this.prefService = new DietPreferenceService();
  }

  async generateSuggestions(userId: string) {
    const prefs = await this.prefService.getPreferences(userId);
    const allActiveFoods = await Food.find({ isActive: true }).exec();

    // 1. Strict Allergen & Exclusion Filtering
    const userAllergensUpper = (prefs.foodAllergies || []).map((a) => a.toUpperCase());
    const excludedUpper = (prefs.excludedFoods || []).map((e) => e.toLowerCase());

    const safeFoods = allActiveFoods.filter((food) => {
      // Allergen safety check
      const hasAllergen = food.allergens.some((a) =>
        userAllergensUpper.includes(a.toUpperCase())
      );
      if (hasAllergen) return false;

      // Excluded foods check
      const isExcluded = excludedUpper.some((ex) =>
        food.normalizedName.includes(ex) || food.name.toLowerCase().includes(ex)
      );
      if (isExcluded) return false;

      // Dietary preference check
      if (prefs.dietaryType === DietaryType.VEGAN) {
        return food.dietaryTags.includes(DietaryTag.VEGAN);
      }
      if (prefs.dietaryType === DietaryType.VEGETARIAN) {
        return food.dietaryTags.includes(DietaryTag.VEGETARIAN) || food.dietaryTags.includes(DietaryTag.VEGAN);
      }
      if (prefs.dietaryType === DietaryType.EGGETARIAN) {
        return (
          food.dietaryTags.includes(DietaryTag.VEGETARIAN) ||
          food.dietaryTags.includes(DietaryTag.VEGAN) ||
          food.dietaryTags.includes(DietaryTag.EGGETARIAN)
        );
      }

      return true;
    });

    const mapToSuggestionItem = (food: IFoodDocument, reason: string): IDietSuggestionItem => {
      const weight = food.weightPerDefaultServingGrams || 100;
      const nutrients = calculateNutrientsForWeight(food.nutrientsPer100g, weight);
      return {
        foodId: food._id.toString(),
        name: food.name,
        category: food.category,
        serving: `${food.defaultServingSize} ${food.defaultServingUnit} (${weight}g)`,
        weightGrams: weight,
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbohydrates: nutrients.carbohydrates,
        fat: nutrients.fat,
        fiber: nutrients.fiber,
        reason,
        dietaryTags: food.dietaryTags,
        allergens: food.allergens,
      };
    };

    // 2. High Protein Foods
    const highProtein = safeFoods
      .filter((f) => f.dietaryTags.includes(DietaryTag.HIGH_PROTEIN) || f.nutrientsPer100g.protein >= 8)
      .sort((a, b) => b.nutrientsPer100g.protein - a.nutrientsPer100g.protein)
      .slice(0, 4)
      .map((f) => mapToSuggestionItem(f, 'High protein density supports muscle recovery and healthy satiety.'));

    // 3. High Fiber / Gut Health Foods
    const highFiber = safeFoods
      .filter((f) => (f.nutrientsPer100g.fiber || 0) >= 2.0)
      .sort((a, b) => (b.nutrientsPer100g.fiber || 0) - (a.nutrientsPer100g.fiber || 0))
      .slice(0, 4)
      .map((f) => mapToSuggestionItem(f, 'Rich in soluble and insoluble fiber for healthy digestion and glycemic stability.'));

    // 4. Meal Suggestions
    const breakfast = safeFoods
      .filter((f) => f.normalizedName.includes('idli') || f.normalizedName.includes('dosa') || f.normalizedName.includes('oatmeal') || f.normalizedName.includes('pongal'))
      .slice(0, 3)
      .map((f) => mapToSuggestionItem(f, 'Nutritious breakfast choice with sustained complex carbohydrates.'));

    const lunch = safeFoods
      .filter((f) => f.normalizedName.includes('rice') || f.normalizedName.includes('sambar') || f.normalizedName.includes('dal') || f.normalizedName.includes('chicken curry') || f.normalizedName.includes('fish curry'))
      .slice(0, 4)
      .map((f) => mapToSuggestionItem(f, 'Well-balanced staple lunch paired with lentils or lean protein.'));

    const dinner = safeFoods
      .filter((f) => f.normalizedName.includes('chapati') || f.normalizedName.includes('dal') || f.normalizedName.includes('poriyal') || f.normalizedName.includes('rasam'))
      .slice(0, 3)
      .map((f) => mapToSuggestionItem(f, 'Light, digestible dinner option that prevents nocturnal glycemic spikes.'));

    const snacks = safeFoods
      .filter((f) => f.normalizedName.includes('sundal') || f.normalizedName.includes('banana') || f.normalizedName.includes('apple') || f.normalizedName.includes('almond') || f.normalizedName.includes('buttermilk') || f.normalizedName.includes('cucumber'))
      .slice(0, 4)
      .map((f) => mapToSuggestionItem(f, 'Low-glycemic wholesome snack to maintain steady daytime energy.'));

    // 5. Smart Healthy Alternatives (Swap comparisons)
    const alternatives = [
      {
        original: 'Plain White Rice',
        substitute: 'Cooked Brown Rice',
        caloriesDiff: '-19 kcal / 100g',
        fiberBenefit: '+1.4g more fiber per 100g for sustained fullness',
        reason: 'Swapping refined white rice with brown rice lowers glycemic index and improves digestion.',
      },
      {
        original: 'Poori (Deep Fried)',
        substitute: 'Chapati (Whole Wheat Roti)',
        caloriesDiff: '-81 kcal / 100g',
        fiberBenefit: '+3.0g more fiber and eliminates deep frying oils',
        reason: 'Dry-roasted whole wheat flatbread provides identical comfort with significantly less saturated fat.',
      },
      {
        original: 'Malabar Parotta',
        substitute: 'Idli (Steamed Rice Cake)',
        caloriesDiff: '-186 kcal / 100g',
        fiberBenefit: 'Steamed fermentation eases digestion and reduces refined oils',
        reason: 'Steamed fermented rice cakes are cholesterol-free and much easier on the digestive tract.',
      },
    ];

    return {
      dietaryPreference: prefs.dietaryType,
      activeAllergens: prefs.foodAllergies,
      highProtein,
      highFiber,
      meals: {
        breakfast,
        lunch,
        dinner,
        snacks,
      },
      alternatives,
    };
  }
}

