import { FoodRepository } from './food.repository.js';
import { FoodCategory, DietaryTag, IFoodDocument } from './food.model.js';
import { SearchFoodsInput } from './food.validation.js';

export class FoodService {
  private foodRepo: FoodRepository;

  constructor() {
    this.foodRepo = new FoodRepository();
  }

  async getFoods(options: SearchFoodsInput, userId?: string) {
    const { foods, total } = await this.foodRepo.searchFoods({
      query: options.q,
      category: options.category,
      dietaryTag: options.dietaryTag,
      minCalories: options.minCalories,
      maxCalories: options.maxCalories,
      minProtein: options.minProtein,
      userId,
      page: options.page,
      limit: options.limit,
    });

    return {
      foods,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async getFoodById(id: string): Promise<IFoodDocument | null> {
    return this.foodRepo.findById(id);
  }

  async getCategories() {
    return this.foodRepo.getCategories();
  }

  async getFavorites(userId: string) {
    return this.foodRepo.findFavorites(userId);
  }

  async toggleFavorite(foodId: string, userId: string) {
    const isFavorited = await this.foodRepo.toggleFavorite(foodId, userId);
    return { foodId, isFavorited };
  }

  async getFoodsByIds(ids: string[]): Promise<IFoodDocument[]> {
    return this.foodRepo.findByIds(ids);
  }
}

