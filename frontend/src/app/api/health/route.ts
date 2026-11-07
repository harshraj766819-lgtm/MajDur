import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let backendHealth: any = null;

  try {
    const res = await fetch("http://localhost:5000/api/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      backendHealth = await res.json();
    }
  } catch {
    backendHealth = null;
  }

  const responsePayload = {
    status: backendHealth?.status === "healthy" ? "healthy" : "operational",
    platform: "MajDur Full-Stack Platform",
    tagline: "Find Work. Hire Workers. Build Your Future.",
    developer: "Harsh Singh",
    timestamp: new Date().toISOString(),
    frontend: {
      status: "up",
      framework: "Next.js 14 App Router",
      responseTimeMs: Date.now() - startTime,
    },
    backend: backendHealth || {
      status: "unreachable",
      hint: "Start backend server via 'npm run dev' or 'npm run dev:backend'",
    },
    database: {
      provider: "MongoDB",
      status: backendHealth?.services?.database?.status || "checked_via_backend",
    },
    version: "1.0.0",
  };

  return NextResponse.json(responsePayload, { status: 200 });
}
