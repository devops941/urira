import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // If it's our known operational error
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, {
      code: err.code,
      data: (err as any).data,
    });
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError' || err.errors) {
    const errorDetails = err.errors?.map((e: any) => ({
      field: e.path?.join('.'),
      message: e.message,
    }));
    const firstMsg = err.errors?.[0]?.message || 'Validation error';
    sendError(res, firstMsg, 400, errorDetails);
    return;
  }

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : undefined;
    let message = `Duplicate value entered for ${field}`;
    if (field.toLowerCase().includes('email')) {
      message = 'An account with this email address already exists';
    } else if (field.toLowerCase().includes('mobile')) {
      message = (value === null || value === undefined || value === '')
        ? 'An account with these details already exists'
        : 'An account with this mobile number already exists';
    }
    sendError(res, message, 409);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid authentication token', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Authentication token has expired', 401);
    return;
  }

  // Unhandled / Internal Server Error
  console.error('💥 Unhandled Server Error:', err);
  sendError(res, 'An unexpected internal server error occurred. Please try again later.', 500);
};

