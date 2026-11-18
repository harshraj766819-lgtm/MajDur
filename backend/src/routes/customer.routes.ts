import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { authenticateUser, requireRole } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Protect all customer routes with authentication & customer/admin role
router.use("/customer", authenticateUser);

// ========================================================
// 1. GET /api/customer/dashboard - Summary stats and feeds
// ========================================================
router.get("/customer/dashboard", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;

    // Fetch customer user details & profile
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        customerProfile: true,
        addresses: {
          orderBy: { isDefault: "desc" },
        },
      },
    });

    if (!user) {
      return sendError(res, "Customer account not found", 404);
    }

    // Parallel aggregate booking counts by status
    const [
      totalBookings,
      pendingBookings,
      acceptedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      completedList,
      recentBookings,
      recentNotifications,
    ] = await Promise.all([
      prisma.booking.count({ where: { customerId } }),
      prisma.booking.count({ where: { customerId, status: "REQUESTED" } }),
      prisma.booking.count({ where: { customerId, status: { in: ["ACCEPTED", "CONFIRMED"] } } }),
      prisma.booking.count({ where: { customerId, status: "IN_PROGRESS" } }),
      prisma.booking.count({ where: { customerId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { customerId, status: { in: ["CANCELLED", "REJECTED"] } } }),
      prisma.booking.findMany({
        where: { customerId, status: "COMPLETED" },
        select: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { customerId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              avatar: true,
              phone: true,
              workerProfile: {
                select: {
                  category: true,
                  dailyRate: true,
                  locationCity: true,
                  rating: true,
                },
              },
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              paidAt: true,
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { userId: customerId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate total expenditure on completed bookings
    const totalSpent = completedList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return sendSuccess(
      res,
      {
        profile: user,
        stats: {
          totalBookings,
          pendingBookings,
          acceptedBookings: acceptedBookings + inProgressBookings,
          inProgressBookings,
          completedBookings,
          cancelledBookings,
          totalSpent,
        },
        recentBookings,
        recentNotifications,
      },
      "Customer dashboard metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/customer/profile - Customer profile & addresses
// ========================================================
router.get("/customer/profile", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        customerProfile: true,
        addresses: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return sendError(res, "Customer not found", 404);
    }

    return sendSuccess(res, user, "Customer profile retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. PUT /api/customer/profile - Update personal information
// ========================================================
router.put("/customer/profile", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { name, email, avatar, alternatePhone, city, state, pincode } = req.body;

    // Validate name
    if (name !== undefined && (!name || typeof name !== "string" || name.trim().length < 2)) {
      return sendError(res, "Name must be at least 2 characters long.", 400);
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          id: { not: customerId },
        },
      });
      if (existingEmail) {
        return sendError(res, "This email address is already registered to another account.", 409);
      }
    }

    // Update User record
    const updatedUser = await prisma.user.update({
      where: { id: customerId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(avatar !== undefined && { avatar: avatar.trim() || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    // Upsert CustomerProfile record
    const updatedProfile = await prisma.customerProfile.upsert({
      where: { userId: customerId },
      create: {
        userId: customerId,
        alternatePhone: alternatePhone?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
      },
      update: {
        ...(alternatePhone !== undefined && { alternatePhone: alternatePhone ? alternatePhone.trim() : null }),
        ...(city !== undefined && { city: city ? city.trim() : null }),
        ...(state !== undefined && { state: state ? state.trim() : null }),
        ...(pincode !== undefined && { pincode: pincode ? pincode.trim() : null }),
      },
    });

    return sendSuccess(
      res,
      { user: updatedUser, customerProfile: updatedProfile },
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. PUT /api/customer/change-password
// ========================================================
router.put("/customer/change-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, "Current password and new password are required.", 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, "New password must be at least 6 characters long.", 400);
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return sendError(res, "New password and confirmation do not match.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { password: true },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, "Current password is incorrect.", 400);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: customerId },
      data: { password: hashedPassword },
    });

    return sendSuccess(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 5. Customer Address Management
// ========================================================

// POST /api/customer/addresses - Add new address
router.post("/customer/addresses", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { title = "Home", line1, line2, area, city, state = "Delhi", pincode, isDefault = false } = req.body;

    if (!line1 || !city || !pincode) {
      return sendError(res, "Street address line 1, city, and PIN code are required.", 400);
    }

    // If marked default, unset any previous defaults for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: customerId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: customerId,
        title: title.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        area: area?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault: Boolean(isDefault),
      },
    });

    return sendSuccess(res, address, "Address saved successfully", 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/customer/addresses/:id - Update existing address
router.put("/customer/addresses/:id", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;
    const { title, line1, line2, area, city, state, pincode, isDefault } = req.body;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== customerId) {
      return sendError(res, "Address not found or unauthorized.", 404);
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: customerId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(line1 !== undefined && { line1: line1.trim() }),
        ...(line2 !== undefined && { line2: line2 ? line2.trim() : null }),
        ...(area !== undefined && { area: area ? area.trim() : null }),
        ...(city !== undefined && { city: city.trim() }),
        ...(state !== undefined && { state: state.trim() }),
        ...(pincode !== undefined && { pincode: pincode.trim() }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
      },
    });

    return sendSuccess(res, updated, "Address updated successfully");
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customer/addresses/:id - Delete an address
router.delete("/customer/addresses/:id", requireRole("CUSTOMER", "ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== customerId) {
      return sendError(res, "Address not found or unauthorized.", 404);
    }

    await prisma.address.delete({
      where: { id },
    });

    return sendSuccess(res, null, "Address removed successfully");
  } catch (error) {
    next(error);
  }
});

export default router;

