import { Router } from 'express';
import { SleepController } from './sleep.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new SleepController();

router.use(requireAuth);

router.post('/', controller.addSleepRecord);
router.get('/latest', controller.getLatest);
router.get('/range', controller.getRangeSummary);
router.get('/summary', controller.getWeeklySummary);
router.get('/history', controller.getHistory);
router.patch('/:id', controller.updateSleepRecord);
router.delete('/:id', controller.deleteSleepRecord);

export const sleepRoutes = router;

