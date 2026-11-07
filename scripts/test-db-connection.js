const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("=========================================");
  console.log("MajDur Database Connectivity Verifier");
  console.log("Developer: Harsh Singh");
  console.log("Target DATABASE_URL:", process.env.DATABASE_URL ? "CONFIGURED (hidden for safety)" : "NOT SET");
  console.log("=========================================\n");

  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as connected`;
    const latency = Date.now() - startTime;
    console.log(`[SUCCESS] Connected to PostgreSQL successfully! (Latency: ${latency}ms)`);
    console.log("[INFO] Ready for Prisma migrations and schema push.\n");
    process.exit(0);
  } catch (error) {
    console.log("[STATUS] PostgreSQL server is not responding at the configured DATABASE_URL.");
    console.log("[DIAGNOSTIC]", error.message);
    console.log("\n[HOW TO START POSTGRESQL ON WINDOWS]:");
    console.log("Option A: If using Docker Desktop:");
    console.log("   1. Open Docker Desktop");
    console.log("   2. Run: docker compose up -d");
    console.log("Option B: If using local PostgreSQL service:");
    console.log("   1. Start-Service postgresql*");
    console.log("   2. Verify credentials in .env");
    console.log("Option C: If using Cloud PostgreSQL (Neon / Supabase / Render):");
    console.log("   1. Paste your connection string in .env: DATABASE_URL=\"...\"");
    console.log("\nOnce PostgreSQL is reachable, push schema and seed categories:");
    console.log("   npm run prisma:push");
    console.log("   npm run prisma:seed\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
