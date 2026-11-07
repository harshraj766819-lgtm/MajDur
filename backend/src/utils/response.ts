import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = "Operation successful",
  statusCode = 200,
  meta?: any
) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message = "An unexpected error occurred",
  statusCode = 500,
  code = "INTERNAL_SERVER_ERROR",
  details?: any
) {
  const payload: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}

