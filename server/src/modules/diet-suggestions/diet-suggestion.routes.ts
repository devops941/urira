import { Router } from 'express';
import { DietSuggestionController } from './diet-suggestion.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new DietSuggestionController();

router.use(requireAuth);

router.get('/', controller.getSuggestions);
router.post('/generate', controller.getSuggestions);

export const dietSuggestionRoutes = router;
