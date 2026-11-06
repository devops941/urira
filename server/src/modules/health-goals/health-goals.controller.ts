import { Request, Response } from 'express';
import { healthGoalsService } from './health-goals.service.js';
import { GoalStatus } from './health-goals.model.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class HealthGoalsController {
  async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const goal = await healthGoalsService.createGoal(userId, req.body);
      sendSuccess(res, 'Health goal created successfully', goal, 201);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to create health goal', 400);
    }
  }

  async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const status = req.query.status as GoalStatus | undefined;
      const goals = await healthGoalsService.getGoals(userId, status);
      sendSuccess(res, 'Health goals retrieved', goals);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve goals', 500);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const goal = await healthGoalsService.getById(req.params.id, userId);
      if (!goal) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health goal retrieved', goal);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve goal', 500);
    }
  }

  async updateGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const updated = await healthGoalsService.updateGoal(req.params.id, userId, req.body);
      if (!updated) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health goal updated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update goal', 400);
    }
  }

  async updateProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const updated = await healthGoalsService.updateProgress(
        req.params.id,
        userId,
        req.body.currentValue
      );
      if (!updated) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Goal progress updated', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update goal progress', 400);
    }
  }

  async pauseGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const updated = await healthGoalsService.pauseGoal(req.params.id, userId);
      if (!updated) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health goal paused', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to pause goal', 500);
    }
  }

  async resumeGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const updated = await healthGoalsService.resumeGoal(req.params.id, userId);
      if (!updated) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health goal resumed', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to resume goal', 500);
    }
  }

  async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }
      const success = await healthGoalsService.deleteGoal(req.params.id, userId);
      if (!success) {
        sendError(res, 'Health goal not found or unauthorized', 404);
        return;
      }
      sendSuccess(res, 'Health goal deleted successfully', { id: req.params.id });
    } catch (error: any) {
      sendError(res, error.message || 'Failed to delete goal', 500);
    }
  }
}

export const healthGoalsController = new HealthGoalsController();

