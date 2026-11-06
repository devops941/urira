import { Types } from 'mongoose';
import {
  DietPreference,
  IDietPreferenceDocument,
  DietaryType,
} from './diet-preference.model.js';

export class DietPreferenceRepository {
  async findByUserId(userId: string | Types.ObjectId): Promise<IDietPreferenceDocument | null> {
    return DietPreference.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async upsert(
    userId: string | Types.ObjectId,
    data: Partial<IDietPreferenceDocument>
  ): Promise<IDietPreferenceDocument> {
    const userObjId = new Types.ObjectId(userId);
    const updated = await DietPreference.findOneAndUpdate(
      { userId: userObjId },
      { $set: { ...data, userId: userObjId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    return updated!;
  }
}

