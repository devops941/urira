import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      sendSuccess(
        res,
        'Account created successfully. A verification code has been sent to your email.',
        result,
        201
      );
    } catch (error) {
      next(error);
    }
  };

  verifyRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.verifyRegistrationOtp(req.body);
      sendSuccess(res, 'Account verified successfully. You can now log in.', result, 200);
    } catch (error) {
      next(error);
    }
  };

  resendRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.resendRegistrationOtp(req.body);
      sendSuccess(res, 'A new verification code has been dispatched.', result, 200);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await this.service.login(req.body, deviceInfo, ipAddress);
      sendSuccess(res, 'Login successful', result, 200);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.service.refreshToken(refreshToken);
      sendSuccess(res, 'Token refreshed successfully', result, 200);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await this.service.logout(refreshToken);
      }
      sendSuccess(res, 'Successfully logged out', null, 200);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.forgotPassword(req.body);
      sendSuccess(res, result.message, { resetSessionId: result.resetSessionId }, 200);
    } catch (error) {
      next(error);
    }
  };

  verifyResetOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.verifyResetOtp(req.body);
      sendSuccess(res, 'Verification code confirmed. You may now reset your password.', result, 200);
    } catch (error) {
      next(error);
    }
  };

  resendResetOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { resetSessionId } = req.body;
      // Resend using the token ID
      const result = await this.service.forgotPassword({ identifier: resetSessionId });
      sendSuccess(res, 'A new reset code has been dispatched.', result, 200);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.resetPassword(req.body);
      sendSuccess(res, 'Password reset successfully. Please log in with your new credentials.', null, 200);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.sub;
      const user = await this.service.getCurrentUser(userId);
      sendSuccess(res, 'User profile fetched successfully', { user }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

