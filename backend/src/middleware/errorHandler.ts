import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  // Prisma unique constraint error
  if (err.code === "P2002") {
    const fields = (err.meta?.target as string[]) || ["field"];
    return sendError(
      res,
      `A record with this ${fields.join(", ")} already exists.`,
      409,
      "DUPLICATE_RECORD",
      err.meta
    );
  }

  // Zod validation error
  if (err.name === "ZodError") {
    return sendError(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      err.errors
    );
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid authentication token", 401, "UNAUTHORIZED");
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Authentication token expired", 401, "TOKEN_EXPIRED");
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";

  return sendError(res, message, statusCode, code, err.stack);
}

