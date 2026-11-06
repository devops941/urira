import { Router } from 'express';
import { reportController } from './report.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const reportRoutes = Router();

reportRoutes.use(requireAuth);

reportRoutes.get('/dashboard', (req, res) => reportController.getHealthDashboard(req, res));
reportRoutes.get('/trends', (req, res) => reportController.getHistoricalTrends(req, res));
reportRoutes.get('/export/csv', (req, res) => reportController.exportCsv(req, res));
reportRoutes.get('/export/printable', (req, res) => reportController.exportPrintableReport(req, res));

