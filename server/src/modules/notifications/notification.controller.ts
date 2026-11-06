import { Request, Response } from 'express';
import { notificationService } from './notification.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      await notificationService.seedContextualNotificationsIfEmpty(userId);
      const data = await notificationService.getNotifications(userId);
      sendSuccess(res, 'Notifications retrieved successfully', data);
    } catch (err: any) {
      sendError(res, err.message || 'Failed to fetch notifications', 500);
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;
      const success = await notificationService.markAsRead(userId, id);
      sendSuccess(res, 'Notification marked as read', { success });
    } catch (err: any) {
      sendError(res, err.message || 'Failed to update notification', 500);
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const count = await notificationService.markAllAsRead(userId);
      sendSuccess(res, 'All notifications marked as read', { count });
    } catch (err: any) {
      sendError(res, err.message || 'Failed to update notifications', 500);
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;
      const success = await notificationService.deleteNotification(userId, id);
      sendSuccess(res, 'Notification removed', { success });
    } catch (err: any) {
      sendError(res, err.message || 'Failed to delete notification', 500);
    }
  }
}

export const notificationController = new NotificationController();
