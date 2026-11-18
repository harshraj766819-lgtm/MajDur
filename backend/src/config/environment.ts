import dotenv from "dotenv";
import path from "path";

// Load from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "super-secure-majdur-jwt-secret-key-2026",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "super-secure-majdur-jwt-access-key-2026",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "super-secure-majdur-jwt-refresh-key-2026",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "7d",
  // Cookie Configuration
  COOKIE_SECRET: process.env.COOKIE_SECRET || "majdur-cookie-secret-key-2026",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  // Razorpay Payment Configuration (Test Mode enforced initially)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET:
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "majdur-razorpay-test-webhook-secret-2026",
  RAZORPAY_MODE: (process.env.RAZORPAY_MODE || "auto").toLowerCase(), // "auto" | "test" | "sandbox"
  ALLOW_LIVE_PAYMENTS: process.env.ALLOW_LIVE_PAYMENTS === "true",
  DEVELOPER: "Harsh Singh",
  APP_NAME: "MajDur",
};
