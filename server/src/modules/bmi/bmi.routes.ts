import { Router } from 'express';
import { bmiController } from './bmi.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { calculateBmiSchema } from './bmi.validation.js';

export const bmiRoutes = Router();

bmiRoutes.use(requireAuth);

bmiRoutes.post('/calculate', validateBody(calculateBmiSchema), (req, res) =>
  bmiController.calculate(req, res)
);
bmiRoutes.get('/latest', (req, res) => bmiController.getLatest(req, res));
bmiRoutes.get('/history', (req, res) => bmiController.getHistory(req, res));
bmiRoutes.get('/:id', (req, res) => bmiController.getById(req, res));
bmiRoutes.delete('/:id', (req, res) => bmiController.deleteById(req, res));

