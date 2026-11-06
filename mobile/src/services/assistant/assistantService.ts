import { apiClient } from '../api/axiosInstance';
import { ApiResponse } from '../../types/api';
import {
  ChatMessage,
  ChatResponse,
  ConversationSummary,
  MessageFeedback,
  SendMessagePayload,
} from '../../types/assistant';

export const assistantService = {
  /**
   * Send a message to the AI Health Assistant
   */
  async sendMessage(payload: SendMessagePayload): Promise<ChatResponse> {
    const res = await apiClient.post<ApiResponse<ChatResponse>>(
      '/ai/assistant/chat',
      payload
    );
    return res.data.data!;
  },

  /**
   * Retrieve list of past conversation threads
   */
  async getConversations(): Promise<ConversationSummary[]> {
    const res = await apiClient.get<ApiResponse<ConversationSummary[]>>(
      '/ai/assistant/conversations'
    );
    return res.data.data || [];
  },

  /**
   * Retrieve a single conversation thread with all its messages
   */
  async getConversationById(id: string): Promise<{
    conversation: ConversationSummary;
    messages: ChatMessage[];
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        conversation: ConversationSummary;
        messages: ChatMessage[];
      }>
    >(`/ai/assistant/conversations/${id}`);
    return res.data.data!;
  },

  /**
   * Delete an entire conversation thread
   */
  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/ai/assistant/conversations/${id}`);
  },

  /**
   * Clear all messages in a conversation
   */
  async clearConversation(id: string): Promise<void> {
    await apiClient.post(`/ai/assistant/conversations/${id}/clear`);
  },

  /**
   * Submit helpful/unhelpful feedback on an assistant message
   */
  async submitFeedback(
    messageId: string,
    feedback: MessageFeedback,
    comment?: string
  ): Promise<void> {
    await apiClient.post('/ai/assistant/feedback', {
      messageId,
      feedback,
      comment,
    });
  },

  /**
   * Retrieve dynamic suggested questions personalized to user health
   */
  async getSuggestedQuestions(): Promise<string[]> {
    const res = await apiClient.get<ApiResponse<string[]>>(
      '/ai/assistant/suggested-questions'
    );
    return res.data.data || [];
  },
};

