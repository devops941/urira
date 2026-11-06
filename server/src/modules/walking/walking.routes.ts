import { Router } from 'express';
import { WalkingController } from './walking.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new WalkingController();

router.use(requireAuth);

router.post('/start', controller.startSession);
router.post('/:sessionId/pause', controller.pauseSession);
router.post('/:sessionId/resume', controller.resumeSession);
router.post('/:sessionId/complete', controller.completeSession);
router.get('/active', controller.getActiveSession);
router.get('/history', controller.getSessionHistory);
router.get('/summary/daily', controller.getDailySummary);

export const walkingRoutes = router;

