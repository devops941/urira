import { Router } from 'express';
import { healthHistoryController } from './health-history.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const healthHistoryRoutes = Router();

healthHistoryRoutes.use(requireAuth);

healthHistoryRoutes.get('/', (req, res) => healthHistoryController.getHistory(req, res));
healthHistoryRoutes.get('/:id', (req, res) => healthHistoryController.getById(req, res));
healthHistoryRoutes.delete('/:id', (req, res) => healthHistoryController.deleteById(req, res));

