import { HealthProfileModel, IHealthProfile } from './health-profile.model.js';

export class HealthProfileRepository {
  async findByUserId(userId: string): Promise<IHealthProfile | null> {
    return HealthProfileModel.findOne({ userId });
  }

  async create(data: Partial<IHealthProfile>): Promise<IHealthProfile> {
    return HealthProfileModel.create(data);
  }

  async upsertByUserId(
    userId: string,
    updateData: Partial<IHealthProfile>
  ): Promise<IHealthProfile> {
    return HealthProfileModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async updateByUserId(
    userId: string,
    updateData: Partial<IHealthProfile>
  ): Promise<IHealthProfile | null> {
    return HealthProfileModel.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
}

export const healthProfileRepository = new HealthProfileRepository();

