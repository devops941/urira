import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'MEDICATION_REMINDER'
  | 'WATER_REMINDER'
  | 'GOAL_ACHIEVED'
  | 'HEALTH_ALERT'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  categoryColor: string;
  actionRoute?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['MEDICATION_REMINDER', 'WATER_REMINDER', 'GOAL_ACHIEVED', 'HEALTH_ALERT', 'SYSTEM'],
      default: 'SYSTEM',
    },
    categoryColor: {
      type: String,
      default: '#12372A',
    },
    actionRoute: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);

