import { Router } from 'express';
import { FoodLogController } from './food-log.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new FoodLogController();

// All food log endpoints are user-protected
router.use(requireAuth);

router.post('/', controller.addFoodLog);
router.get('/today', controller.getTodayLogs);
router.get('/history', controller.getHistory);
router.get('/range', controller.getRangeSummary);
router.get('/:id', controller.getLogById);
router.patch('/:id', controller.updateFoodLog);
router.delete('/:id', controller.deleteFoodLog);

export const foodLogRoutes = router;
