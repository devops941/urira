import { Types } from 'mongoose';
import { SleepRecord, ISleepRecordDocument } from './sleep.model.js';

export class SleepRepository {
  async create(data: Partial<ISleepRecordDocument>): Promise<ISleepRecordDocument> {
    return SleepRecord.create(data);
  }

  async findLatest(userId: string): Promise<ISleepRecordDocument | null> {
    return SleepRecord.findOne({ userId: new Types.ObjectId(userId) })
      .sort({ wakeTime: -1 })
      .exec();
  }

  async findById(id: string, userId: string): Promise<ISleepRecordDocument | null> {
    return SleepRecord.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ISleepRecordDocument[]> {
    return SleepRecord.find({
      userId: new Types.ObjectId(userId),
      dateString: { $gte: startDate, $lte: endDate },
    })
      .sort({ dateString: 1, wakeTime: 1 })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    data: Partial<ISleepRecordDocument>
  ): Promise<ISleepRecordDocument | null> {
    return SleepRecord.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    ).exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await SleepRecord.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }
}

