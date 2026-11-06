import { Types } from 'mongoose';
import { FoodLog, IFoodLogDocument, MealType } from './food-log.model.js';

export class FoodLogRepository {
  async create(data: Partial<IFoodLogDocument>): Promise<IFoodLogDocument> {
    const doc = await FoodLog.create(data);
    return doc.populate('foodId');
  }

  async findById(id: string, userId: string): Promise<IFoodLogDocument | null> {
    return FoodLog.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    })
      .populate('foodId')
      .exec();
  }

  async findByDate(userId: string, dateString: string): Promise<IFoodLogDocument[]> {
    return FoodLog.find({
      userId: new Types.ObjectId(userId),
      dateString,
    })
      .sort({ consumedAt: 1 })
      .populate('foodId')
      .exec();
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    mealType?: MealType
  ): Promise<IFoodLogDocument[]> {
    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      dateString: { $gte: startDate, $lte: endDate },
    };

    if (mealType) {
      query.mealType = mealType;
    }

    return FoodLog.find(query)
      .sort({ dateString: -1, consumedAt: -1 })
      .populate('foodId')
      .exec();
  }

  async update(
    id: string,
    userId: string,
    updateData: Partial<IFoodLogDocument>
  ): Promise<IFoodLogDocument | null> {
    return FoodLog.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true }
    )
      .populate('foodId')
      .exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await FoodLog.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }

  async getRecent(userId: string, limit = 5): Promise<IFoodLogDocument[]> {
    return FoodLog.find({ userId: new Types.ObjectId(userId) })
      .sort({ consumedAt: -1 })
      .limit(limit)
      .populate('foodId')
      .exec();
  }
}

