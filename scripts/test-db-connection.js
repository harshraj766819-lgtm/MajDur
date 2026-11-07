const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("=========================================");
  console.log("MajDur MongoDB Connectivity Verifier");
  console.log("Developer: Harsh Singh");
  console.log("Target DATABASE_URL:", process.env.DATABASE_URL ? "CONFIGURED (hidden for safety)" : "NOT SET");
  console.log("=========================================\n");

  try {
    const startTime = Date.now();
    // In Prisma with MongoDB, execute ping or count query
    const res = await prisma.$runCommandRaw({ ping: 1 });
    const categoryCount = await prisma.category.count();
    const latency = Date.now() - startTime;

    console.log(`[SUCCESS] Connected to MongoDB successfully! (Latency: ${latency}ms)`);
    console.log(`[DATA STATUS] Current collections verified. Total categories in DB: ${categoryCount}`);
    console.log("[INFO] Ready for Prisma schema synchronization and application startup.\n");
    process.exit(0);
  } catch (error) {
    console.log("[STATUS] MongoDB server is not responding at the configured DATABASE_URL.");
    console.log("[DIAGNOSTIC]", error.message);
    console.log("\n[HOW TO CONFIGURE MONGODB]:");
    console.log("Option A: If using MongoDB Atlas / Cloud:");
    console.log("   - Verify DATABASE_URL in .env (Format: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/majdur?retryWrites=true&w=majority)");
    console.log("Option B: If using local MongoDB server:");
    console.log("   - Ensure mongod is running on port 27017");
    console.log("   - Update .env: DATABASE_URL=\"mongodb://127.0.0.1:27017/majdur?directConnection=true\"\n");
    console.log("To synchronize collections and seed data:");
    console.log("   npm run prisma:push");
    console.log("   npm run prisma:seed\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
