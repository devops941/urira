import { Types } from 'mongoose';
import {
  WaterLog,
  WaterGoal,
  IWaterLogDocument,
  IWaterGoalDocument,
} from './water.model.js';

export class WaterRepository {
  async createLog(data: Partial<IWaterLogDocument>): Promise<IWaterLogDocument> {
    return WaterLog.create(data);
  }

  async findLogsByDate(userId: string, dateString: string): Promise<IWaterLogDocument[]> {
    return WaterLog.find({
      userId: new Types.ObjectId(userId),
      dateString,
    })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async findLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<IWaterLogDocument[]> {
    return WaterLog.find({
      userId: new Types.ObjectId(userId),
      dateString: { $gte: startDate, $lte: endDate },
    })
      .sort({ dateString: 1, recordedAt: 1 })
      .exec();
  }

  async deleteLog(id: string, userId: string): Promise<boolean> {
    const res = await WaterLog.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }

  async getGoal(userId: string): Promise<IWaterGoalDocument | null> {
    return WaterGoal.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async upsertGoal(
    userId: string,
    data: Partial<IWaterGoalDocument>
  ): Promise<IWaterGoalDocument> {
    const userObjId = new Types.ObjectId(userId);
    const updated = await WaterGoal.findOneAndUpdate(
      { userId: userObjId },
      { $set: { ...data, userId: userObjId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return updated!;
  }
}

