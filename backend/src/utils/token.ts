import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { ENV } from "../config/environment";

export interface TokenPayload {
  userId: string;
  role: string;
  name: string;
  phone: string;
  email?: string | null;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { userId: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createRefreshSession({
  userId,
  refreshToken,
  userAgent,
  ipAddress,
}: {
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return prisma.refreshSession.create({
    data: {
      userId,
      tokenHash,
      userAgent: userAgent || "Unknown",
      ipAddress: ipAddress || "Unknown",
      expiresAt,
    },
  });
}

export async function rotateRefreshSession({
  oldRefreshToken,
  newRefreshToken,
  userAgent,
  ipAddress,
}: {
  oldRefreshToken: string;
  newRefreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const oldHash = hashToken(oldRefreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash: oldHash },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh session");
  }

  // Revoke old session
  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  // Create new session
  return createRefreshSession({
    userId: session.userId,
    refreshToken: newRefreshToken,
    userAgent,
    ipAddress,
  });
}

export async function revokeRefreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  return prisma.refreshSession.updateMany({
    where: { tokenHash },
    data: { isRevoked: true },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.refreshSession.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

