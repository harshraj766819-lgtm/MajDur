const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("=========================================");
  console.log("MajDur Database Connectivity Verifier");
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
    console.log("[REASON]", error.message);
    console.log("\n[HOW TO START POSTGRESQL]:");
    console.log("1. If using Docker Desktop:");
    console.log("   - Start Docker Desktop");
    console.log("   - Run: docker compose up -d");
    console.log("2. If using local PostgreSQL on Windows:");
    console.log("   - Make sure postgresql service is started: Start-Service postgresql*");
    console.log("   - Verify password and database name in .env");
    console.log("3. If using Cloud PostgreSQL (Neon / Supabase / Render):");
    console.log("   - Update DATABASE_URL in .env with your cloud connection string\n");
    console.log("4. Once connected, push the schema:");
    console.log("   - npx prisma db push");
    console.log("   - npm run db:seed\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
