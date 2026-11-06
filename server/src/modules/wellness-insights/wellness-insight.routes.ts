import { Router } from 'express';
import { WellnessInsightController } from './wellness-insight.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new WellnessInsightController();

router.use(requireAuth);

router.get('/today', controller.generateInsights);
router.get('/weekly', controller.generateInsights);
router.get('/vitality', controller.getDailyVitality);
router.post('/generate', controller.generateInsights);

export const wellnessInsightRoutes = router;

