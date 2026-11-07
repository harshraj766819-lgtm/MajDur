import dotenv from "dotenv";
import path from "path";

// Load from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/majdur_db?schema=public",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET || "super-secure-majdur-jwt-secret-key-2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  DEVELOPER: "Harsh Singh",
  APP_NAME: "MajDur",
};
