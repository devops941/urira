import { Types } from 'mongoose';
import { NutritionSummary, INutritionSummaryDocument } from './nutrition.model.js';

export class NutritionRepository {
  async findByDate(
    userId: string | Types.ObjectId,
    date: string
  ): Promise<INutritionSummaryDocument | null> {
    return NutritionSummary.findOne({
      userId: new Types.ObjectId(userId),
      date,
    }).exec();
  }

  async upsertDailySummary(
    userId: string | Types.ObjectId,
    date: string,
    data: Partial<INutritionSummaryDocument>
  ): Promise<INutritionSummaryDocument> {
    const userObjId = new Types.ObjectId(userId);
    const updated = await NutritionSummary.findOneAndUpdate(
      { userId: userObjId, date },
      {
        $set: {
          ...data,
          userId: userObjId,
          date,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return updated!;
  }

  async getRecentSummaries(
    userId: string | Types.ObjectId,
    limitDays = 7
  ): Promise<INutritionSummaryDocument[]> {
    return NutritionSummary.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ date: -1 })
      .limit(limitDays)
      .exec();
  }

  async getDateRangeSummaries(
    userId: string | Types.ObjectId,
    startDate: string,
    endDate: string
  ): Promise<INutritionSummaryDocument[]> {
    return NutritionSummary.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1 })
      .exec();
  }
}

