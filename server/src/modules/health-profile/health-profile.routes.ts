import { Router } from 'express';
import { healthProfileController } from './health-profile.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { updateHealthProfileSchema } from './health-profile.validation.js';
import { uploadAvatarMiddleware } from '../../middleware/upload.middleware.js';

export const healthProfileRoutes = Router();

healthProfileRoutes.use(requireAuth);

healthProfileRoutes.get('/', (req, res) => healthProfileController.getProfile(req, res));
healthProfileRoutes.patch(
  '/',
  validateBody(updateHealthProfileSchema),
  (req, res) => healthProfileController.updateProfile(req, res)
);
healthProfileRoutes.post(
  '/avatar',
  uploadAvatarMiddleware.single('avatar'),
  (req, res) => healthProfileController.uploadAvatar(req, res)
);
healthProfileRoutes.post('/onboarding/complete', (req, res) =>
  healthProfileController.completeOnboarding(req, res)
);
healthProfileRoutes.post('/onboarding/skip', (req, res) =>
  healthProfileController.skipOnboarding(req, res)
);


