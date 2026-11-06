import { Request, Response } from 'express';
import { healthProfileService } from './health-profile.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class HealthProfileController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const profile = await healthProfileService.getProfile(userId);
      sendSuccess(res, 'Health profile retrieved successfully', profile);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to retrieve health profile', 500);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const updated = await healthProfileService.updateProfile(userId, req.body);
      sendSuccess(res, 'Health profile updated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to update health profile', 500);
    }
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      if (!req.file || !req.file.buffer) {
        sendError(res, 'No image file uploaded', 400);
        return;
      }
      const updated = await healthProfileService.uploadAvatar(userId, req.file.buffer);
      sendSuccess(res, 'Profile avatar uploaded successfully to Cloudinary', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to upload profile avatar', 500);
    }
  }

  async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const updated = await healthProfileService.completeOnboarding(userId, req.body);
      sendSuccess(res, 'Health onboarding completed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to complete health onboarding', 500);
    }
  }

  async skipOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        sendError(res, 'User ID not identified from token', 401);
        return;
      }
      const updated = await healthProfileService.skipOnboarding(userId);
      sendSuccess(res, 'Health onboarding skipped', updated);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to skip health onboarding', 500);
    }
  }
}

export const healthProfileController = new HealthProfileController();

