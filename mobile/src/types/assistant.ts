export type DomainClassification =
  | 'HEALTH_RELATED'
  | 'NOT_HEALTH_RELATED'
  | 'UNCERTAIN'
  | 'EMERGENCY_OR_HIGH_RISK';

export type MessageSender = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type MessageFeedback = 'HELPFUL' | 'NOT_HELPFUL';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  category?: string;
  classification?: DomainClassification;
  disclaimer?: string;
  contextUsed?: string[];
  feedback?: MessageFeedback;
  createdAt: string | Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageAt: string | Date;
  createdAt: string | Date;
}

export interface SendMessagePayload {
  conversationId?: string;
  message: string;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  userMessage: {
    id: string;
    content: string;
    createdAt: string | Date;
  };
  assistantMessage: {
    id: string;
    content: string;
    category: string;
    classification: DomainClassification;
    disclaimer: string;
    contextUsed: string[];
    createdAt: string | Date;
  };
}

