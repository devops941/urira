import { AIRecommendationModel, IAIRecommendation } from './ai-recommendations.model.js';
import { AiRecommendationType } from './ai-recommendations.types.js';

export class AIRecommendationRepository {
  async create(data: Partial<IAIRecommendation>): Promise<IAIRecommendation> {
    return AIRecommendationModel.create(data);
  }

  async findLatestByUserAndType(
    userId: string,
    recommendationType: AiRecommendationType
  ): Promise<IAIRecommendation | null> {
    return AIRecommendationModel.findOne({ userId, recommendationType }).sort({ createdAt: -1 });
  }

  async findByUser(userId: string, limit: number = 20): Promise<IAIRecommendation[]> {
    return AIRecommendationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: 'ACTIVE' | 'ARCHIVED' | 'ACCEPTED'
  ): Promise<IAIRecommendation | null> {
    return AIRecommendationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true }
    );
  }
}

export const aiRecommendationRepository = new AIRecommendationRepository();

