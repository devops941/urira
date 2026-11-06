import { Types } from 'mongoose';
import {
  VitalRecord,
  IVitalRecordDocument,
  VitalMetricType,
} from './vital.model.js';

export class VitalRepository {
  async create(data: Partial<IVitalRecordDocument>): Promise<IVitalRecordDocument> {
    return VitalRecord.create(data);
  }

  async findLatestByMetric(
    userId: string,
    metricType: VitalMetricType
  ): Promise<IVitalRecordDocument | null> {
    return VitalRecord.findOne({
      userId: new Types.ObjectId(userId),
      metricType,
    })
      .sort({ measuredAt: -1 })
      .exec();
  }

  async findHistory(
    userId: string,
    options: {
      metricType?: VitalMetricType;
      startDate?: string;
      endDate?: string;
      limit: number;
    }
  ): Promise<IVitalRecordDocument[]> {
    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (options.metricType) {
      query.metricType = options.metricType;
    }

    if (options.startDate || options.endDate) {
      query.dateString = {};
      if (options.startDate) query.dateString.$gte = options.startDate;
      if (options.endDate) query.dateString.$lte = options.endDate;
    }

    return VitalRecord.find(query)
      .sort({ measuredAt: -1 })
      .limit(options.limit)
      .exec();
  }

  async findById(id: string, userId: string): Promise<IVitalRecordDocument | null> {
    return VitalRecord.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await VitalRecord.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }
}

