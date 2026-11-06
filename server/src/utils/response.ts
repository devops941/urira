import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: any
): Response => {
  const payload: ApiResponse = {
    success: false,
    message,
    ...(error !== undefined ? { error } : {}),
  };
  return res.status(statusCode).json(payload);
};

