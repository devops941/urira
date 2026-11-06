import { Router } from 'express';
import { DietPreferenceController } from './diet-preference.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new DietPreferenceController();

router.use(requireAuth);

router.get('/preferences', controller.getPreferences);
router.patch('/preferences', controller.updatePreferences);

export const dietPreferenceRoutes = router;
