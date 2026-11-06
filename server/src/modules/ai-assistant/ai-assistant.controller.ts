import { Request, Response } from 'express';
import { aiAssistantService } from './ai-assistant.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AIAssistantController {
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const { message, conversationId } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        sendError(res, 'Message text is required', 400);
        return;
      }

      if (message.length > 3000) {
        sendError(res, 'Message exceeds 3,000 characters limit', 400);
        return;
      }

      const result = await aiAssistantService.chat(userId, {
        conversationId,
        message: message.trim(),
      });

      sendSuccess(res, 'Health assistant response generated', result);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to process AI chat message', 500);
    }
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const list = await aiAssistantService.getConversations(userId);
      sendSuccess(res, 'Conversations retrieved successfully', list);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve conversations', 500);
    }
  }

  async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const { id } = req.params;
      const data = await aiAssistantService.getConversationById(userId, id);
      sendSuccess(res, 'Conversation retrieved successfully', data);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve conversation', 404);
    }
  }

  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const { id } = req.params;
      const deleted = await aiAssistantService.deleteConversation(userId, id);
      if (deleted) {
        sendSuccess(res, 'Conversation deleted successfully');
      } else {
        sendError(res, 'Conversation not found', 404);
      }
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete conversation', 500);
    }
  }

  async clearConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const { id } = req.params;
      const cleared = await aiAssistantService.clearConversation(userId, id);
      if (cleared) {
        sendSuccess(res, 'Conversation history cleared successfully');
      } else {
        sendError(res, 'Conversation not found', 404);
      }
    } catch (error: any) {
      sendError(res, error.message || 'Failed to clear conversation', 500);
    }
  }

  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const { messageId, feedback, comment } = req.body;
      if (!messageId || !['HELPFUL', 'NOT_HELPFUL'].includes(feedback)) {
        sendError(res, 'Valid messageId and feedback (HELPFUL/NOT_HELPFUL) are required', 400);
        return;
      }

      const updated = await aiAssistantService.submitFeedback(
        userId,
        messageId,
        feedback,
        comment
      );

      if (updated) {
        sendSuccess(res, 'Feedback submitted successfully');
      } else {
        sendError(res, 'Message not found or unauthorized', 404);
      }
    } catch (error: any) {
      sendError(res, error.message || 'Failed to submit feedback', 500);
    }
  }

  async getSuggestedQuestions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }

      const questions = await aiAssistantService.getSuggestedQuestions(userId);
      sendSuccess(res, 'Suggested questions retrieved successfully', questions);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve suggested questions', 500);
    }
  }
}

export const aiAssistantController = new AIAssistantController();

