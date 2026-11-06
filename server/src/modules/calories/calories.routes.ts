import { Router } from 'express';
import { calorieController } from './calories.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { estimateCaloriesSchema } from './calories.validation.js';

export const calorieRoutes = Router();

calorieRoutes.use(requireAuth);

calorieRoutes.post('/estimate', validateBody(estimateCaloriesSchema), (req, res) =>
  calorieController.estimate(req, res)
);
calorieRoutes.get('/latest', (req, res) => calorieController.getLatest(req, res));
calorieRoutes.get('/history', (req, res) => calorieController.getHistory(req, res));
calorieRoutes.get('/:id', (req, res) => calorieController.getById(req, res));
calorieRoutes.delete('/:id', (req, res) => calorieController.deleteById(req, res));

