const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function check() {
  try {
    const categories = await prisma.category.count();
    const users = await prisma.user.count();
    const workers = await prisma.workerProfile.count();
    const contractors = await prisma.contractorProfile.count();
    const jobs = await prisma.job.count();
    const bookings = await prisma.booking.count();
    console.log("DATABASE COUNTS:", { categories, users, workers, contractors, jobs, bookings });
  } catch (err) {
    console.error("Error checking counts:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
check();

