import mongoose, { Schema, Document } from 'mongoose';
import { IConversationDocument, IMessageDocument } from './ai-assistant.types.js';

// Conversation Schema
const ConversationSchema = new Schema<IConversationDocument & Document>(
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
      default: 'Health Consultation',
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export const AIConversationModel = mongoose.model<IConversationDocument & Document>(
  'AIConversation',
  ConversationSchema
);

// Message Schema
const MessageSchema = new Schema<IMessageDocument & Document>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['USER', 'ASSISTANT', 'SYSTEM'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    category: {
      type: String,
      default: 'GENERAL_WELLNESS',
    },
    classification: {
      type: String,
      enum: ['HEALTH_RELATED', 'NOT_HEALTH_RELATED', 'UNCERTAIN', 'EMERGENCY_OR_HIGH_RISK'],
      default: 'HEALTH_RELATED',
    },
    disclaimer: {
      type: String,
      trim: true,
    },
    contextUsed: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      enum: ['HELPFUL', 'NOT_HELPFUL'],
      default: undefined,
    },
    feedbackComment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AIMessageModel = mongoose.model<IMessageDocument & Document>(
  'AIMessage',
  MessageSchema
);

