import { Types } from 'mongoose';
import { NotificationModel, INotification, NotificationType } from './notification.model.js';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  categoryColor: string;
  actionRoute?: string;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  private toDto(doc: INotification): NotificationDto {
    return {
      id: doc._id.toString(),
      title: doc.title,
      message: doc.message,
      type: doc.type,
      categoryColor: doc.categoryColor,
      actionRoute: doc.actionRoute,
      isRead: doc.isRead,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  async getNotifications(userId: string): Promise<{ notifications: NotificationDto[]; unreadCount: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const notifications = await NotificationModel.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await NotificationModel.countDocuments({
      userId: userObjectId,
      isRead: false,
    });

    return {
      notifications: notifications.map((n) => this.toDto(n)),
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const res = await NotificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } }
    );
    return res.modifiedCount > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
    return res.modifiedCount;
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const res = await NotificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
    return res.deletedCount > 0;
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    categoryColor?: string;
    actionRoute?: string;
  }): Promise<NotificationDto> {
    const notif = await NotificationModel.create({
      userId: new Types.ObjectId(data.userId),
      title: data.title,
      message: data.message,
      type: data.type,
      categoryColor: data.categoryColor || '#12372A',
      actionRoute: data.actionRoute,
      isRead: false,
    });
    return this.toDto(notif);
  }

  async seedContextualNotificationsIfEmpty(userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    const count = await NotificationModel.countDocuments({ userId: userObjectId });
    if (count > 0) return;

    // Seed 4 initial health notifications
    await NotificationModel.insertMany([
      {
        userId: userObjectId,
        title: 'Medication Reminder',
        message: 'Time for your scheduled tablet dose. Stay consistent with your prescribed plan.',
        type: 'MEDICATION_REMINDER',
        categoryColor: '#12372A',
        actionRoute: '/(protected)/medications',
        isRead: false,
      },
      {
        userId: userObjectId,
        title: 'Hydration Target Check',
        message: "You're 60% towards your daily water goal. Remember to drink a glass of water now!",
        type: 'WATER_REMINDER',
        categoryColor: '#06B6D4',
        actionRoute: '/(protected)/water',
        isRead: false,
      },
      {
        userId: userObjectId,
        title: 'Daily Step Goal in Reach',
        message: 'Great effort! You are only 1,800 steps away from hitting your daily activity target.',
        type: 'GOAL_ACHIEVED',
        categoryColor: '#0EA5E9',
        actionRoute: '/(protected)/activity',
        isRead: false,
      },
      {
        userId: userObjectId,
        title: 'Weekly Health Summary Ready',
        message: 'Your weekly comprehensive health report and AI wellness insights have been compiled.',
        type: 'SYSTEM',
        categoryColor: '#8B5CF6',
        actionRoute: '/(protected)/analytics',
        isRead: true,
      },
    ]);
  }
}

export const notificationService = new NotificationService();

