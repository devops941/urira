import { Types } from 'mongoose';

export type DomainClassification =
  | 'HEALTH_RELATED'
  | 'NOT_HEALTH_RELATED'
  | 'UNCERTAIN'
  | 'EMERGENCY_OR_HIGH_RISK';

export type MessageSender = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type MessageFeedback = 'HELPFUL' | 'NOT_HELPFUL';

export interface IConversationDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  lastMessage?: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  sender: MessageSender;
  content: string;
  category?: string;
  classification?: DomainClassification;
  disclaimer?: string;
  contextUsed?: string[];
  feedback?: MessageFeedback;
  feedbackComment?: string;
  createdAt: Date;
}

export interface SendMessageDto {
  conversationId?: string;
  message: string;
}

export interface ChatResponseDto {
  conversationId: string;
  messageId: string;
  userMessage: {
    id: string;
    content: string;
    createdAt: Date;
  };
  assistantMessage: {
    id: string;
    content: string;
    category: string;
    classification: DomainClassification;
    disclaimer: string;
    contextUsed: string[];
    createdAt: Date;
  };
}

export interface ConversationSummaryDto {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageAt: Date;
  createdAt: Date;
  messageCount?: number;
}

