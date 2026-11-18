import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { verifyAccessToken, TokenPayload } from "../utils/token";
import { sendError } from "../utils/response";

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        phone: string;
        email?: string | null;
        role: "CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN";
        avatar?: string | null;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        isActive: boolean;
      };
      tokenPayload?: TokenPayload;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Try to read token from cookies
    if (req.cookies && req.cookies.majdur_access_token) {
      token = req.cookies.majdur_access_token;
    }

    // 2. Try to read token from Authorization Bearer header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, "Authentication required. Please sign in.", 401);
    }

    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, "Access token expired. Please refresh your session.", 401);
      }
      return sendError(res, "Invalid authentication token. Please sign in again.", 401);
    }

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return sendError(res, "User account no longer exists.", 401);
    }

    if (!user.isActive) {
      return sendError(res, "Your account has been deactivated. Please contact support.", 403);
    }

    req.user = user as any;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: Array<"CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Your role is ${req.user.role}.`,
        403
      );
    }

    next();
  };
}

export function requireVerifiedUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required.", 401);
  }

  if (!req.user.isPhoneVerified && !req.user.isEmailVerified) {
    return sendError(
      res,
      "Account verification required. Please verify your phone number via OTP to continue.",
      403
    );
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required.", 401);
  }

  if (req.user.role !== "ADMIN") {
    return sendError(res, "Administrator privileges required.", 403);
  }

  next();
}

