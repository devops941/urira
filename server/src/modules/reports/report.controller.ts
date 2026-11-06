import { Request, Response } from 'express';
import { reportService } from './report.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ReportController {
  async getHealthDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const timeframe = (req.query.timeframe as 'daily' | 'weekly' | 'monthly') || 'weekly';
      const dashboard = await reportService.getHealthDashboard(userId, timeframe);
      sendSuccess(res, 'Health dashboard analytics compiled successfully', dashboard);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate health dashboard', 500);
    }
  }

  async getHistoricalTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const metric = (req.query.metric as 'steps' | 'water' | 'sleep' | 'vitals' | 'calories') || 'steps';
      const days = parseInt(req.query.days as string, 10) || 14;
      const trends = await reportService.getHistoricalTrends(userId, metric, days);
      sendSuccess(res, 'Historical trends retrieved successfully', trends);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to retrieve historical trends', 500);
    }
  }

  async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const csvData = await reportService.generateCsvExport(userId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="uyira_health_report.csv"');
      res.status(200).send(csvData);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to export CSV report', 500);
    }
  }

  async exportPrintableReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const html = await reportService.generatePrintableReportHtml(userId);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to generate printable report', 500);
    }
  }
}

export const reportController = new ReportController();
