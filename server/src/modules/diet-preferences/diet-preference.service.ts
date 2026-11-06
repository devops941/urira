import { DietPreferenceRepository } from './diet-preference.repository.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import { DietaryType, IDietPreferenceDocument } from './diet-preference.model.js';

export class DietPreferenceService {
  private repo: DietPreferenceRepository;

  constructor() {
    this.repo = new DietPreferenceRepository();
  }

  async getPreferences(userId: string): Promise<IDietPreferenceDocument> {
    let prefs = await this.repo.findByUserId(userId);
    if (!prefs) {
      // Sync from HealthProfile if available
      const profile = await HealthProfileModel.findOne({ userId }).exec();
      let dietaryType = DietaryType.ANY;
      const allergies: string[] = [];

      if (profile) {
        if ((profile as any).dietaryPreference) {
          const rawDiet = (profile as any).dietaryPreference.toUpperCase();
          if (rawDiet.includes('VEGAN')) dietaryType = DietaryType.VEGAN;
          else if (rawDiet.includes('VEGETARIAN')) dietaryType = DietaryType.VEGETARIAN;
          else if (rawDiet.includes('EGGETARIAN')) dietaryType = DietaryType.EGGETARIAN;
          else if (rawDiet.includes('NON')) dietaryType = DietaryType.NON_VEGETARIAN;
        }

        if (Array.isArray((profile as any).allergies)) {
          allergies.push(...(profile as any).allergies);
        }
      }

      prefs = await this.repo.upsert(userId, {
        dietaryType,
        cuisinePreferences: ['SOUTH_INDIAN', 'GENERAL_INDIAN'],
        foodAllergies: allergies,
        excludedFoods: [],
        dislikedFoods: [],
        mealsPerDay: 3,
      });
    }

    return prefs;
  }

  async updatePreferences(
    userId: string,
    data: {
      dietaryType?: DietaryType;
      cuisinePreferences?: string[];
      foodAllergies?: string[];
      excludedFoods?: string[];
      dislikedFoods?: string[];
      mealsPerDay?: number;
    }
  ): Promise<IDietPreferenceDocument> {
    return this.repo.upsert(userId, data);
  }
}
