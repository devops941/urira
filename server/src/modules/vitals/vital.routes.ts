import { Router } from 'express';
import { VitalController } from './vital.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new VitalController();

router.use(requireAuth);

router.post('/', controller.addVitalRecord);
router.get('/latest', controller.getLatestSnapshot);
router.get('/history', controller.getHistory);
router.delete('/:id', controller.deleteRecord);

export const vitalRoutes = router;

