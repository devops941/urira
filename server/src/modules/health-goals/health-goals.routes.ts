import { Router } from 'express';
import { healthGoalsController } from './health-goals.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import {
  createGoalSchema,
  updateGoalSchema,
  updateProgressSchema,
} from './health-goals.validation.js';

export const healthGoalsRoutes = Router();

healthGoalsRoutes.use(requireAuth);

healthGoalsRoutes.post('/', validateBody(createGoalSchema), (req, res) =>
  healthGoalsController.createGoal(req, res)
);
healthGoalsRoutes.get('/', (req, res) => healthGoalsController.getGoals(req, res));
healthGoalsRoutes.get('/:id', (req, res) => healthGoalsController.getById(req, res));
healthGoalsRoutes.patch('/:id', validateBody(updateGoalSchema), (req, res) =>
  healthGoalsController.updateGoal(req, res)
);
healthGoalsRoutes.delete('/:id', (req, res) => healthGoalsController.deleteGoal(req, res));

healthGoalsRoutes.patch('/:id/progress', validateBody(updateProgressSchema), (req, res) =>
  healthGoalsController.updateProgress(req, res)
);
healthGoalsRoutes.patch('/:id/pause', (req, res) => healthGoalsController.pauseGoal(req, res));
healthGoalsRoutes.patch('/:id/resume', (req, res) => healthGoalsController.resumeGoal(req, res));

