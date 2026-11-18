import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ENV } from "../config/environment";
import { authenticateUser, requireAdmin } from "../middleware/auth";

const router = Router();

// RBAC Protected Test Route
router.get("/admin/test-rbac", authenticateUser, requireAdmin, (req: Request, res: Response) => {
  return res.json({ success: true, message: "Welcome Admin! RBAC verified." });
});

router.get("/health", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;
  let dbError: string | null = null;
  let categoryCount = 0;

  try {
    const t0 = Date.now();
    await prisma.$runCommandRaw({ ping: 1 });
    categoryCount = await prisma.category.count();
    dbLatency = Date.now() - t0;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "disconnected";
    dbError = error?.message || "MongoDB connection failed";
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
        engine: "MongoDB",
        status: dbStatus,
        latencyMs: dbLatency,
        activeCategoriesCount: categoryCount,
        error: dbError,
      },
    },
  };

  const statusCode = dbStatus === "connected" ? 200 : 503;
  return res.status(statusCode).json(payload);
});

export default router;
