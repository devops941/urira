import { Router } from 'express';
import { NutritionController } from './nutrition.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new NutritionController();

router.use(requireAuth);

router.get('/summary', controller.getTodaySummary);
router.get('/daily', controller.getDailySummary);
router.get('/weekly', controller.getWeeklySummaries);
router.get('/trends', controller.getTrends);

export const nutritionRoutes = router;
