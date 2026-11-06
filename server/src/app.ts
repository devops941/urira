import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthProfileRoutes } from './modules/health-profile/health-profile.routes.js';
import { bmiRoutes } from './modules/bmi/bmi.routes.js';
import { calorieRoutes } from './modules/calories/calories.routes.js';
import { healthGoalsRoutes } from './modules/health-goals/health-goals.routes.js';
import { healthHistoryRoutes } from './modules/health-history/health-history.routes.js';
import { aiRoutes } from './modules/ai-recommendations/ai-recommendations.routes.js';
import { foodRoutes } from './modules/foods/food.routes.js';
import { foodLogRoutes } from './modules/food-logs/food-log.routes.js';
import { nutritionRoutes } from './modules/nutrition/nutrition.routes.js';
import { dietPreferenceRoutes } from './modules/diet-preferences/diet-preference.routes.js';
import { dietSuggestionRoutes } from './modules/diet-suggestions/diet-suggestion.routes.js';
import { mealPlanRoutes } from './modules/meal-planner/meal-plan.routes.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { waterRoutes } from './modules/water/water.routes.js';
import { sleepRoutes } from './modules/sleep/sleep.routes.js';
import { medicationRoutes } from './modules/medications/medication.routes.js';
import { vitalRoutes } from './modules/vitals/vital.routes.js';
import { wellnessInsightRoutes } from './modules/wellness-insights/wellness-insight.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';
import { walkingRoutes } from './modules/walking/walking.routes.js';
import { aiAssistantRoutes } from './modules/ai-assistant/ai-assistant.routes.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ENV } from './config/env.js';

export const createApp = (): Application => {
  const app = express();

  // Security Headers & CORS
  app.use(helmet());
  app.use(
    cors({
      origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Request Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // General Rate Limiting
  app.use(generalLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', app: 'UYIRA Health Platform' });
  });

  // Mount Auth Routes
  app.use('/api/v1/auth', authRoutes);

  // Mount Health Modules (Phase 2)
  app.use('/api/v1/health-profile', healthProfileRoutes);
  app.use('/api/v1/health/bmi', bmiRoutes);
  app.use('/api/v1/health/calories', calorieRoutes);
  app.use('/api/v1/health/goals', healthGoalsRoutes);
  app.use('/api/v1/health/history', healthHistoryRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // Mount Nutrition & Diet Modules (Phase 3)
  app.use('/api/v1/foods', foodRoutes);
  app.use('/api/v1/food-logs', foodLogRoutes);
  app.use('/api/v1/nutrition', nutritionRoutes);
  app.use('/api/v1/diet/suggestions', dietSuggestionRoutes);
  app.use('/api/v1/diet', dietPreferenceRoutes);
  app.use('/api/v1/meal-plans', mealPlanRoutes);
  app.use('/api/v1/meal-plan', mealPlanRoutes);
  app.use('/api/v1/nutrition/meal-plans', mealPlanRoutes);
  app.use('/api/v1/nutrition/meal-plan', mealPlanRoutes);
  app.use('/meal-plans', mealPlanRoutes);
  app.use('/meal-plan', mealPlanRoutes);

  // Mount Activity & Wellness Modules (Phase 4)
  app.use('/api/v1/activity', activityRoutes);
  app.use('/api/v1/walking', walkingRoutes);
  app.use('/api/v1/walking-sessions', walkingRoutes);
  app.use('/api/v1/activity/walking', walkingRoutes);
  app.use('/walking', walkingRoutes);
  app.use('/api/v1/water', waterRoutes);
  app.use('/api/v1/sleep', sleepRoutes);
  app.use('/api/v1/medications', medicationRoutes);
  app.use('/api/v1/medication', medicationRoutes);
  app.use('/api/v1/auth/medications', medicationRoutes);
  app.use('/api/v1/auth/medication', medicationRoutes);
  app.use('/api/v1/wellness/medications', medicationRoutes);
  app.use('/api/v1/wellness/medication', medicationRoutes);
  app.use('/medications', medicationRoutes);
  app.use('/medication', medicationRoutes);
  app.use('/api/v1/vitals', vitalRoutes);
  app.use('/api/v1/wellness', wellnessInsightRoutes);

  // Mount Dashboard, Analytics & Notification Modules (Phase 5)
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/reports', reportRoutes);

  // Mount AI Health Assistant (Phase 6)
  app.use('/api/v1/ai/assistant', aiAssistantRoutes);

  // Serve static web build of the frontend if present
  const distPath = path.resolve(process.cwd(), '../mobile/dist');

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api/') || req.originalUrl === '/health') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    console.warn(`[404 Not Found] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

