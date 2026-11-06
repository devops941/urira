import { Request, Response, NextFunction } from 'express';
import { WalkingService } from './walking.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class WalkingController {
  private service: WalkingService;

  constructor() {
    this.service = new WalkingService();
  }

  startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const { sessionId, source, startTime, notes } = req.body;
      if (!sessionId) {
        sendError(res, 'sessionId is required', 400);
        return;
      }

      const session = await this.service.startSession(userId, {
        sessionId,
        source,
        startTime,
        notes,
      });

      sendSuccess(res, 'Walking session started successfully', session, 201);
    } catch (error) {
      next(error);
    }
  };

  pauseSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { sessionId } = req.params;
      const { steps, distanceMeters, durationSeconds, caloriesBurned, notes } = req.body;

      const session = await this.service.pauseSession(userId, sessionId, {
        steps,
        distanceMeters,
        durationSeconds,
        caloriesBurned,
        notes,
      });

      if (!session) {
        sendError(res, 'Active walking session not found', 404);
        return;
      }

      sendSuccess(res, 'Walking session paused', session);
    } catch (error) {
      next(error);
    }
  };

  resumeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { sessionId } = req.params;

      const session = await this.service.resumeSession(userId, sessionId);
      if (!session) {
        sendError(res, 'Paused walking session not found', 404);
        return;
      }

      sendSuccess(res, 'Walking session resumed', session);
    } catch (error) {
      next(error);
    }
  };

  completeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const { sessionId } = req.params;
      const { steps, distanceMeters, durationSeconds, caloriesBurned, endTime, notes } = req.body;

      const result = await this.service.completeSession(userId, sessionId, {
        steps,
        distanceMeters,
        durationSeconds,
        caloriesBurned,
        endTime,
        notes,
      });

      sendSuccess(res, 'Walking workout completed & synced to dashboard', result, 200);
    } catch (error) {
      next(error);
    }
  };

  getActiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const session = await this.service.getActiveSession(userId);
      sendSuccess(res, 'Active walking session retrieved', session);
    } catch (error) {
      next(error);
    }
  };

  getSessionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await this.service.getSessionHistory(userId, page, limit);
      sendSuccess(res, 'Walking workout history retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getDailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?._id;
      const dateString = req.query.date as string | undefined;

      const summary = await this.service.getDailySummary(userId, dateString);
      sendSuccess(res, 'Daily walking summary retrieved', summary);
    } catch (error) {
      next(error);
    }
  };
}

