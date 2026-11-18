import crypto from "crypto";
import { prisma } from "../config/prisma";
import { ENV } from "../config/environment";

const OTP_EXPIRY_MINUTES = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 30;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

export function generateOTP(length = 6): string {
  // Generate cryptographically secure random digits
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export async function createPhoneOTP(phone: string): Promise<{ otp: string; expiresAt: Date }> {
  const normalizedPhone = phone.trim();

  // Check cooldown: any token created within the last 60 seconds?
  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedPhone,
      type: "PHONE_OTP",
      createdAt: {
        gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentToken) {
    const secondsRemaining = Math.ceil(
      (recentToken.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
    );
    throw new Error(`Please wait ${secondsRemaining}s before requesting a new OTP`);
  }

  // Delete older expired tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: normalizedPhone,
      type: "PHONE_OTP",
    },
  });

  const otp = generateOTP(6);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedPhone,
      token: otp,
      type: "PHONE_OTP",
      expiresAt,
      attempts: 0,
    },
  });

  // Also update user record if user exists
  await prisma.user.updateMany({
    where: { phone: normalizedPhone },
    data: {
      otpCode: otp,
      otpExpiresAt: expiresAt,
    },
  });

  // Simulated SMS dispatcher: In dev, log to console
  if (!ENV.IS_PRODUCTION) {
    console.log(`\n🔑 [MAJDUR SMS OTP SIMULATOR]`);
    console.log(`📱 Phone: ${normalizedPhone}`);
    console.log(`🔐 OTP Code: ${otp} (Valid for 10 minutes)`);
    console.log(`----------------------------------------\n`);
  }

  return { otp, expiresAt };
}

export async function verifyPhoneOTP(phone: string, inputOtp: string): Promise<boolean> {
  const normalizedPhone = phone.trim();
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedPhone,
      type: "PHONE_OTP",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!tokenRecord) {
    throw new Error("No active OTP request found. Please request a new OTP.");
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  if (tokenRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
    throw new Error("Too many failed attempts. This OTP has been invalidated. Please request a new OTP.");
  }

  if (tokenRecord.token !== inputOtp.trim()) {
    // Increment attempts count
    await prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_OTP_ATTEMPTS - (tokenRecord.attempts + 1);
    throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  // OTP verified! Mark user phone verified and clean up token
  await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
  await prisma.user.updateMany({
    where: { phone: normalizedPhone },
    data: {
      isPhoneVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    },
  });

  return true;
}

export async function createPasswordResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  // Generate random 32-byte hex token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any older reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  // Also update User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expiresAt,
    },
  });

  if (!ENV.IS_PRODUCTION) {
    console.log(`\n🔒 [MAJDUR PASSWORD RESET SIMULATOR]`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🔗 Reset Token: ${rawToken}`);
    console.log(`⏱️ Valid for 30 minutes`);
    console.log(`----------------------------------------\n`);
  }

  return { token: rawToken, expiresAt };
}

export async function verifyPasswordResetToken(rawToken: string): Promise<string> {
  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetRecord || resetRecord.isUsed) {
    throw new Error("Invalid or already used password reset link");
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new Error("Password reset link has expired. Please request a new one.");
  }

  return resetRecord.userId;
}

