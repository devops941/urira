import mongoose, { Schema, Document } from 'mongoose';
import { AiRecommendationType } from './ai-recommendations.types.js';

export interface IAIRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  recommendationType: AiRecommendationType;
  structuredSuggestions: Record<string, any>;
  modelIdentifier: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ACCEPTED';
  createdAt: Date;
  updatedAt: Date;
}

const AIRecommendationSchema = new Schema<IAIRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recommendationType: {
      type: String,
      enum: ['HEALTH_GOALS', 'EXPLAIN_BMI', 'EXPLAIN_CALORIES', 'HEALTH_SUMMARY'],
      required: true,
      index: true,
    },
    structuredSuggestions: {
      type: Schema.Types.Mixed,
      required: true,
    },
    modelIdentifier: {
      type: String,
      default: 'gpt-4o-mini',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'ACCEPTED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

AIRecommendationSchema.index({ userId: 1, createdAt: -1 });

export const AIRecommendationModel = mongoose.model<IAIRecommendation>(
  'AIRecommendation',
  AIRecommendationSchema
);

