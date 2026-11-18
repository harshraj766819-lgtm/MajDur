import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../config/prisma";
import { ENV } from "../config/environment";
import { sendSuccess, sendError } from "../utils/response";
import {
  signAccessToken,
  signRefreshToken,
  createRefreshSession,
  rotateRefreshSession,
  revokeRefreshSession,
  revokeAllUserSessions,
  verifyRefreshToken,
} from "../utils/token";
import {
  createPhoneOTP,
  verifyPhoneOTP,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/verification";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Rate limiters for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests
  message: {
    success: false,
    message: "Too many password reset requests from this IP, please try again after 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to set secure cookies
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = ENV.IS_PRODUCTION;

  res.cookie("majdur_access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("majdur_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res: Response) {
  const isProduction = ENV.IS_PRODUCTION;
  res.clearCookie("majdur_access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
  res.clearCookie("majdur_refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",
  });
}

// -------------------------------------------------------------
// MODULE 1: REGISTRATION ENDPOINTS
// -------------------------------------------------------------

// 1. Customer Registration
router.post("/auth/register/customer", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !phone || !password) {
      return sendError(res, "Name, phone number, and password are required.", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, "Passwords do not match.", 400);
    }

    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return sendError(res, "Please provide a valid 10-digit Indian phone number.", 400);
    }

    const cleanEmail = email?.trim().toLowerCase() || null;

    // Check duplicate phone or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === cleanPhone) {
        return sendError(res, "A user with this phone number already exists.", 409);
      }
      return sendError(res, "A user with this email address already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: hashedPassword,
        role: "CUSTOMER",
        customerProfile: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);
    await createRefreshSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setAuthCookies(res, accessToken, refreshToken);

    // Send verification OTP automatically
    let otpGenerated = false;
    try {
      await createPhoneOTP(cleanPhone);
      otpGenerated = true;
    } catch {}

    return sendSuccess(
      res,
      {
        user,
        accessToken,
        otpSent: otpGenerated,
      },
      "Customer account created successfully.",
      201
    );
  } catch (error) {
    next(error);
  }
});

// 2. Worker Registration
router.post("/auth/register/worker", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      trade,
      experienceYears,
      city,
      pincode,
      dailyRate,
      bio,
    } = req.body;

    if (!name || !phone || !password || !trade || !city) {
      return sendError(res, "Name, phone, password, trade, and city are required.", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400);
    }

    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return sendError(res, "Please provide a valid 10-digit Indian phone number.", 400);
    }

    const cleanEmail = email?.trim().toLowerCase() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === cleanPhone) {
        return sendError(res, "A user with this phone number already exists.", 409);
      }
      return sendError(res, "A user with this email address already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if category exists
    const categoryRecord = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: trade.toLowerCase().replace(/\s+/g, "-") },
          { name: { contains: trade, mode: "insensitive" } },
        ],
      },
    });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: hashedPassword,
        role: "WORKER",
        workerProfile: {
          create: {
            category: categoryRecord ? categoryRecord.name : trade.trim(),
            categoryId: categoryRecord ? categoryRecord.id : null,
            experienceYears: parseInt(experienceYears, 10) || 1,
            locationCity: city.trim(),
            locationState: "India",
            locationPincode: pincode ? pincode.trim() : "110001",
            dailyRate: dailyRate ? parseFloat(dailyRate) : (categoryRecord?.baseDailyRate || 800),
            bio: bio?.trim() || null,
            isAvailable: true,
            isVerified: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);
    await createRefreshSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setAuthCookies(res, accessToken, refreshToken);

    let otpGenerated = false;
    try {
      await createPhoneOTP(cleanPhone);
      otpGenerated = true;
    } catch {}

    return sendSuccess(
      res,
      {
        user,
        accessToken,
        otpSent: otpGenerated,
      },
      "Worker account created successfully.",
      201
    );
  } catch (error) {
    next(error);
  }
});

// 3. Contractor Registration
router.post("/auth/register/contractor", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      companyName,
      contactPerson,
      name,
      email,
      phone,
      password,
      city,
      gstNumber,
      licenseNumber,
    } = req.body;

    const contractorName = contactPerson || name;
    if (!companyName || !contractorName || !phone || !password || !city) {
      return sendError(
        res,
        "Company name, contact person, phone, password, and city are required.",
        400
      );
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400);
    }

    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return sendError(res, "Please provide a valid 10-digit Indian phone number.", 400);
    }

    const cleanEmail = email?.trim().toLowerCase() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.phone === cleanPhone) {
        return sendError(res, "A user with this phone number already exists.", 409);
      }
      return sendError(res, "A user with this email address already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: contractorName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password: hashedPassword,
        role: "CONTRACTOR",
        contractorProfile: {
          create: {
            companyName: companyName.trim(),
            city: city.trim(),
            state: "India",
            gstNumber: gstNumber ? gstNumber.trim() : null,
            licenseNumber: licenseNumber ? licenseNumber.trim() : null,
            isVerified: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);
    await createRefreshSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(
      res,
      {
        user,
        accessToken,
      },
      "Contractor account created successfully.",
      201
    );
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// MODULE 2: LOGIN & SESSION ENDPOINTS
// -------------------------------------------------------------

router.post("/auth/login", loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return sendError(res, "Phone/Email and password are required.", 400);
    }

    const cleanInput = identifier.trim();
    const isEmail = cleanInput.includes("@");
    const cleanPhone = cleanInput.replace(/\D/g, "").slice(-10);

    // Look up user by email or phone
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: cleanInput.toLowerCase() }
        : { phone: cleanPhone },
      include: {
        customerProfile: true,
        workerProfile: true,
        contractorProfile: true,
      },
    });

    if (!user) {
      return sendError(res, "Invalid credentials. Please verify your phone/email and password.", 401);
    }

    // Check account status
    if (!user.isActive) {
      return sendError(res, "Your account has been deactivated. Please contact support.", 403);
    }

    // Role check if user explicitly requested a specific role login
    if (role && user.role !== role) {
      return sendError(
        res,
        `Account exists but is registered as a ${user.role}. Please select the ${user.role} role to continue.`,
        403
      );
    }

    // Validate password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, "Invalid credentials. Please verify your phone/email and password.", 401);
    }

    // Generate short-lived access token + rotating refresh token
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });

    const refreshToken = signRefreshToken(user.id);
    await createRefreshSession({
      userId: user.id,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setAuthCookies(res, accessToken, refreshToken);

    const safeUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profile:
        user.role === "CUSTOMER"
          ? user.customerProfile
          : user.role === "WORKER"
          ? user.workerProfile
          : user.role === "CONTRACTOR"
          ? user.contractorProfile
          : null,
    };

    return sendSuccess(
      res,
      {
        user: safeUser,
        accessToken,
      },
      "Logged in successfully."
    );
  } catch (error) {
    next(error);
  }
});

// Refresh Token Rotation
router.post("/auth/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      req.cookies?.majdur_refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      return sendError(res, "Refresh token is missing.", 401);
    }

    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      return sendError(res, "Invalid or expired refresh token.", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return sendError(res, "Account is invalid or deactivated.", 401);
    }

    // Generate new pair
    const newAccessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
    });

    const newRefreshToken = signRefreshToken(user.id);

    try {
      await rotateRefreshSession({
        oldRefreshToken: refreshToken,
        newRefreshToken,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });
    } catch {
      clearAuthCookies(res);
      return sendError(res, "Session has expired or was revoked. Please log in again.", 401);
    }

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return sendSuccess(
      res,
      { accessToken: newAccessToken },
      "Session refreshed successfully."
    );
  } catch (error) {
    next(error);
  }
});

// Logout current session
router.post("/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      req.cookies?.majdur_refresh_token || req.body?.refreshToken;

    if (refreshToken) {
      await revokeRefreshSession(refreshToken);
    }

    clearAuthCookies(res);

    return sendSuccess(res, null, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
});

// Logout from all sessions
router.post("/auth/logout-all", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await revokeAllUserSessions(req.user!.id);
    clearAuthCookies(res);

    return sendSuccess(res, null, "All active sessions have been terminated.");
  } catch (error) {
    next(error);
  }
});

// Current User Profile
router.get("/auth/me", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        avatar: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
        customerProfile: true,
        workerProfile: true,
        contractorProfile: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user, "User profile retrieved successfully.");
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// MODULE 5: PHONE OTP & EMAIL VERIFICATION
// -------------------------------------------------------------

router.post("/auth/otp/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return sendError(res, "Phone number is required.", 400);
    }

    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return sendError(res, "Please provide a valid 10-digit Indian phone number.", 400);
    }

    const result = await createPhoneOTP(cleanPhone);
    return sendSuccess(
      res,
      { expiresAt: result.expiresAt },
      "6-digit verification OTP has been sent to your phone."
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to send OTP.", 400);
  }
});

router.post("/auth/otp/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return sendError(res, "Phone number and OTP code are required.", 400);
    }

    const cleanPhone = phone.trim().replace(/\D/g, "").slice(-10);
    await verifyPhoneOTP(cleanPhone, otp);

    return sendSuccess(res, { verified: true }, "Phone number verified successfully!");
  } catch (error: any) {
    return sendError(res, error.message || "Invalid or expired OTP.", 400);
  }
});

// -------------------------------------------------------------
// MODULE 3: PASSWORD RESET
// -------------------------------------------------------------

router.post("/auth/password/forgot", passwordResetLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return sendError(res, "Please provide your registered phone number or email.", 400);
    }

    const cleanInput = identifier.trim();
    const isEmail = cleanInput.includes("@");
    const cleanPhone = cleanInput.replace(/\D/g, "").slice(-10);

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: cleanInput.toLowerCase() }
        : { phone: cleanPhone },
    });

    // For security, don't disclose whether account exists
    if (!user) {
      return sendSuccess(
        res,
        null,
        "If an account exists with this credential, a password reset link/OTP has been sent."
      );
    }

    const { token, expiresAt } = await createPasswordResetToken(user.id);

    return sendSuccess(
      res,
      { expiresAt, token: !ENV.IS_PRODUCTION ? token : undefined },
      "Password reset instructions have been dispatched."
    );
  } catch (error) {
    next(error);
  }
});

router.post("/auth/password/reset", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, "Reset token and new password are required.", 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return sendError(res, "Passwords do not match.", 400);
    }

    const userId = await verifyPasswordResetToken(token);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Invalidate reset token and all active sessions
    await prisma.passwordResetToken.updateMany({
      where: { userId },
      data: { isUsed: true },
    });

    await revokeAllUserSessions(userId);

    return sendSuccess(res, null, "Password reset successfully. You can now log in with your new password.");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to reset password.", 400);
  }
});

export default router;

