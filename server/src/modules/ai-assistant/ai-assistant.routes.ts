import { Router } from 'express';
import { aiAssistantController } from './ai-assistant.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const aiAssistantRoutes = Router();

// Require JWT Authentication for all assistant operations
aiAssistantRoutes.use(requireAuth);

// Chat & Message operations
aiAssistantRoutes.post('/chat', (req, res) => aiAssistantController.chat(req, res));
aiAssistantRoutes.get('/suggested-questions', (req, res) =>
  aiAssistantController.getSuggestedQuestions(req, res)
);

// Conversation management
aiAssistantRoutes.get('/conversations', (req, res) =>
  aiAssistantController.getConversations(req, res)
);
aiAssistantRoutes.get('/conversations/:id', (req, res) =>
  aiAssistantController.getConversationById(req, res)
);
aiAssistantRoutes.delete('/conversations/:id', (req, res) =>
  aiAssistantController.deleteConversation(req, res)
);
aiAssistantRoutes.post('/conversations/:id/clear', (req, res) =>
  aiAssistantController.clearConversation(req, res)
);

// Feedback
aiAssistantRoutes.post('/feedback', (req, res) =>
  aiAssistantController.submitFeedback(req, res)
);

