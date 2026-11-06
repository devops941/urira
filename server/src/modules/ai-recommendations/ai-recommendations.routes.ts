import { Router } from 'express';
import { aiRecommendationsController } from './ai-recommendations.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  explainBmiRequestSchema,
  explainCaloriesRequestSchema,
} from './ai-recommendations.validation.js';

export const aiRoutes = Router();

// Protect all AI endpoints with authenticated session token
aiRoutes.use(requireAuth);

aiRoutes.post('/health-goals/suggest', aiRecommendationsController.suggestGoals);
aiRoutes.post(
  '/explain-bmi',
  validateBody(explainBmiRequestSchema),
  aiRecommendationsController.explainBmi
);
aiRoutes.post(
  '/explain-calories',
  validateBody(explainCaloriesRequestSchema),
  aiRecommendationsController.explainCalories
);
aiRoutes.post('/health-summary', aiRecommendationsController.generateHealthSummary);
aiRoutes.get('/recommendations/history', aiRecommendationsController.getRecommendationsHistory);

