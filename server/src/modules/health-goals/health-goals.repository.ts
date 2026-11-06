import { HealthGoalModel, IHealthGoal, GoalStatus } from './health-goals.model.js';

export class HealthGoalsRepository {
  async create(data: Partial<IHealthGoal>): Promise<IHealthGoal> {
    return HealthGoalModel.create(data);
  }

  async findByUserId(userId: string, status?: GoalStatus): Promise<IHealthGoal[]> {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }
    return HealthGoalModel.find(query).sort({ status: 1, targetDate: 1 });
  }

  async findActiveByUserId(userId: string): Promise<IHealthGoal[]> {
    return HealthGoalModel.find({ userId, status: 'ACTIVE' }).sort({ targetDate: 1 });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<IHealthGoal | null> {
    return HealthGoalModel.findOne({ _id: id, userId });
  }

  async updateByIdAndUserId(
    id: string,
    userId: string,
    update: Partial<IHealthGoal>
  ): Promise<IHealthGoal | null> {
    return HealthGoalModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true, runValidators: true }
    );
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<IHealthGoal | null> {
    return HealthGoalModel.findOneAndDelete({ _id: id, userId });
  }
}

export const healthGoalsRepository = new HealthGoalsRepository();

