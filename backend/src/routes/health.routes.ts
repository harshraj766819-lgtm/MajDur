import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { ENV } from "../config/environment";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;
  let dbError: string | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - t0;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "disconnected";
    dbError = error?.message || "PostgreSQL connection failed";
  }

  const payload = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    platform: "MajDur Full-Stack Platform",
    tagline: "Find Work. Hire Workers. Build Your Future.",
    developer: ENV.DEVELOPER,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      backend: {
        status: "up",
        port: ENV.PORT,
        environment: ENV.NODE_ENV,
        responseTimeMs: Date.now() - startTime,
      },
      database: {
        engine: "PostgreSQL",
        status: dbStatus,
        latencyMs: dbLatency,
        error: dbError,
      },
    },
  };

  const statusCode = dbStatus === "connected" ? 200 : 503;
  return res.status(statusCode).json(payload);
});

export default router;
