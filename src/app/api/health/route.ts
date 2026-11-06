import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbStartTime = Date.now();
    // Run lightweight query to verify connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStartTime;
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = "disconnected";
    dbError = error?.message || "Unable to reach database";
  }

  const responsePayload = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: {
        status: "up",
        environment: process.env.NODE_ENV || "development",
        responseTimeMs: Date.now() - startTime,
      },
      database: {
        provider: "PostgreSQL",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
    },
    version: "1.0.0",
  };

  const statusCode = dbStatus === "connected" ? 200 : 503;
  return NextResponse.json(responsePayload, { status: statusCode });
}
