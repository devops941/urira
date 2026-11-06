import { Types } from 'mongoose';
import {
  Medication,
  MedicationDoseEvent,
  IMedicationDocument,
  IMedicationDoseEventDocument,
  DoseStatus,
} from './medication.model.js';

export class MedicationRepository {
  async create(data: Partial<IMedicationDocument>): Promise<IMedicationDocument> {
    return Medication.create(data);
  }

  async findActiveByUser(userId: string): Promise<IMedicationDocument[]> {
    return Medication.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string, userId: string): Promise<IMedicationDocument | null> {
    return Medication.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<IMedicationDocument>
  ): Promise<IMedicationDocument | null> {
    return Medication.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    ).exec();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const res = await Medication.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return (res.deletedCount || 0) > 0;
  }

  async recordDose(
    userId: string,
    medicationId: string,
    scheduledTime: string,
    dateString: string,
    status: DoseStatus,
    notes?: string
  ): Promise<IMedicationDoseEventDocument> {
    return MedicationDoseEvent.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        medicationId: new Types.ObjectId(medicationId),
        dateString,
        scheduledTime,
      },
      {
        $set: {
          status,
          actionRecordedAt: new Date(),
          notes,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  }

  async getDosesByDate(
    userId: string,
    dateString: string
  ): Promise<IMedicationDoseEventDocument[]> {
    return MedicationDoseEvent.find({
      userId: new Types.ObjectId(userId),
      dateString,
    })
      .populate('medicationId')
      .exec();
  }

  async getAdherenceHistory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<IMedicationDoseEventDocument[]> {
    return MedicationDoseEvent.find({
      userId: new Types.ObjectId(userId),
      dateString: { $gte: startDate, $lte: endDate },
    })
      .populate('medicationId')
      .exec();
  }
}

