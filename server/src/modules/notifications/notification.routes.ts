import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', (req, res) => notificationController.getNotifications(req, res));
notificationRoutes.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));
notificationRoutes.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));
notificationRoutes.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

