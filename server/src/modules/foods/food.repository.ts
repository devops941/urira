import { Types } from 'mongoose';
import { Food, IFoodDocument, FoodCategory, DietaryTag } from './food.model.js';

export class FoodRepository {
  async findById(id: string | Types.ObjectId): Promise<IFoodDocument | null> {
    return Food.findById(id).exec();
  }

  async findByIds(ids: (string | Types.ObjectId)[]): Promise<IFoodDocument[]> {
    return Food.find({ _id: { $in: ids }, isActive: true }).exec();
  }

  async searchFoods(options: {
    query?: string;
    category?: FoodCategory | string;
    dietaryTag?: DietaryTag;
    maxCalories?: number;
    minCalories?: number;
    minProtein?: number;
    userId?: string;
    page: number;
    limit: number;
  }): Promise<{ foods: IFoodDocument[]; total: number }> {
    const filter: Record<string, any> = { isActive: true };

    if (options.userId) {
      filter.$and = [
        {
          $or: [
            { isVerified: true },
            { createdBy: new Types.ObjectId(options.userId) },
          ],
        },
      ];
    }

    if (options.query && options.query.trim()) {
      const q = options.query.trim().toLowerCase();
      const queryMatch = {
        $or: [
          { normalizedName: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { ingredients: { $regex: q, $options: 'i' } },
        ],
      };
      if (filter.$and) {
        filter.$and.push(queryMatch);
      } else {
        filter.$or = queryMatch.$or;
      }
    }

    if (options.category && options.category !== 'ALL') {
      if (options.category === 'CUSTOM' || options.category === 'MY_FOODS') {
        if (options.userId) {
          filter.createdBy = new Types.ObjectId(options.userId);
        } else {
          filter.isCustom = true;
        }
      } else {
        filter.category = options.category;
      }
    }

    if (options.dietaryTag) {
      filter.dietaryTags = options.dietaryTag;
    }

    if (options.minCalories !== undefined || options.maxCalories !== undefined) {
      filter['nutrientsPer100g.calories'] = {};
      if (options.minCalories !== undefined) {
        filter['nutrientsPer100g.calories'].$gte = options.minCalories;
      }
      if (options.maxCalories !== undefined) {
        filter['nutrientsPer100g.calories'].$lte = options.maxCalories;
      }
    }

    if (options.minProtein !== undefined) {
      filter['nutrientsPer100g.protein'] = { $gte: options.minProtein };
    }

    const skip = (options.page - 1) * options.limit;

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .sort({ isCustom: -1, isVerified: -1, name: 1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      Food.countDocuments(filter).exec(),
    ]);

    return { foods, total };
  }

  async getCategories(): Promise<{ category: string; count: number }[]> {
    const counts = await Food.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return counts.map((item) => ({
      category: item._id,
      count: item.count,
    }));
  }

  async findFavorites(userId: string | Types.ObjectId): Promise<IFoodDocument[]> {
    return Food.find({
      favoritedBy: new Types.ObjectId(userId),
      isActive: true,
    })
      .sort({ name: 1 })
      .exec();
  }

  async toggleFavorite(foodId: string, userId: string): Promise<boolean> {
    const food = await Food.findById(foodId);
    if (!food) return false;

    const userObjId = new Types.ObjectId(userId);
    const hasFav = food.favoritedBy.some((id) => id.equals(userObjId));

    if (hasFav) {
      await Food.findByIdAndUpdate(foodId, {
        $pull: { favoritedBy: userObjId },
      });
      return false; // now un-favorited
    } else {
      await Food.findByIdAndUpdate(foodId, {
        $addToSet: { favoritedBy: userObjId },
      });
      return true; // now favorited
    }
  }

  async create(foodData: Partial<IFoodDocument>): Promise<IFoodDocument> {
    return Food.create(foodData);
  }

  async count(): Promise<number> {
    return Food.countDocuments({ isActive: true });
  }
}

