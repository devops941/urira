import { Router } from 'express';
import { WaterController } from './water.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new WaterController();

router.use(requireAuth);

router.post('/', controller.addWater);
router.get('/today', controller.getTodaySummary);
router.get('/summary', controller.getWeeklySummary);
router.get('/history', controller.getHistory);
router.get('/goal', controller.getGoal);
router.patch('/goal', controller.updateGoal);
router.delete('/:id', controller.deleteWaterLog);

export const waterRoutes = router;

