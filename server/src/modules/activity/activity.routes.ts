import { Router } from 'express';
import { ActivityController } from './activity.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ActivityController();

router.use(requireAuth);

router.post('/', controller.addActivity);
router.get('/today', controller.getTodaySummary);
router.get('/weekly', controller.getWeeklyTrends);
router.get('/range', controller.getRangeSummary);
router.get('/history', controller.getHistory);
router.patch('/:id', controller.updateActivity);
router.delete('/:id', controller.deleteActivity);

export const activityRoutes = router;

