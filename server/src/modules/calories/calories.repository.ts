import { CalorieRecordModel, ICalorieRecord } from './calories.model.js';

export class CalorieRepository {
  async create(data: Partial<ICalorieRecord>): Promise<ICalorieRecord> {
    return CalorieRecordModel.create(data);
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ICalorieRecord[]> {
    return CalorieRecordModel.find({ userId }).sort({ calculatedAt: -1 }).limit(limit);
  }

  async findLatestByUserId(userId: string): Promise<ICalorieRecord | null> {
    return CalorieRecordModel.findOne({ userId }).sort({ calculatedAt: -1 });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ICalorieRecord | null> {
    return CalorieRecordModel.findOne({ _id: id, userId });
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<ICalorieRecord | null> {
    return CalorieRecordModel.findOneAndDelete({ _id: id, userId });
  }
}

export const calorieRepository = new CalorieRepository();

