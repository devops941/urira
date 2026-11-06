import { BMIRecordModel, IBMIRecord } from './bmi.model.js';

export class BMIRepository {
  async create(data: Partial<IBMIRecord>): Promise<IBMIRecord> {
    return BMIRecordModel.create(data);
  }

  async findByUserId(userId: string, limit: number = 50): Promise<IBMIRecord[]> {
    return BMIRecordModel.find({ userId }).sort({ calculatedAt: -1 }).limit(limit);
  }

  async findLatestByUserId(userId: string): Promise<IBMIRecord | null> {
    return BMIRecordModel.findOne({ userId }).sort({ calculatedAt: -1 });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<IBMIRecord | null> {
    return BMIRecordModel.findOne({ _id: id, userId });
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<IBMIRecord | null> {
    return BMIRecordModel.findOneAndDelete({ _id: id, userId });
  }
}

export const bmiRepository = new BMIRepository();

