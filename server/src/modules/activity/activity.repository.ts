import { Types } from 'mongoose';
import { ActivityRecord, IActivityRecordDocument } from './activity.model.js';

export class ActivityRepository {
  async create(data: Partial<IActivityRecordDocument>): Promise<IActivityRecordDocument> {
    return ActivityRecord.create(data);
  }

  async findById(id: string, userId: string): Promise<IActivityRecordDocument | null> {
    return ActivityRecord.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async findByDate(userId: string, dateString: string): Promise<IActivityRecordDocument[]> {
    return ActivityRecord.find({
      userId: new Types.ObjectId(userId),
      dateString,
    })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<IActivityRecordDocument[]> {
    return ActivityRecord.find({
      userId: new Types.ObjectId(userId),
      dateString: { $gte: startDate, $lte: endDate },
    })
      .sort({ dateString: 1, recordedAt: 1 })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<IActivityRecordDocument>
  ): Promise<IActivityRecordDocument | null> {
    return ActivityRecord.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    ).exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await ActivityRecord.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }
}

