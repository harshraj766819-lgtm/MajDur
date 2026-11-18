import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { NotificationService } from "../services/notification.service";

const router = Router();

// All booking operations require authentication
router.use(authenticateUser);

// ========================================================
// 1. POST /api/bookings - Create a new booking request
// ========================================================
router.post("/bookings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { 
      workerId, 
      serviceCategory, 
      startDate, 
      endDate, 
      totalDays = 1, 
      address, 
      city, 
      notes 
    } = req.body;

    if (!workerId) {
      return sendError(res, "Worker ID is required to initiate a booking request.", 400);
    }

    if (!startDate || !address || !city) {
      return sendError(res, "Start date, service address, and city are mandatory.", 400);
    }

    // Find worker and ensure they have a valid worker profile
    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true },
    });

    if (!worker || worker.role !== "WORKER" || !worker.workerProfile) {
      return sendError(res, "The requested artisan / worker profile was not found.", 404);
    }

    if (!worker.workerProfile.isAvailable) {
      return sendError(res, "This worker is currently marked unavailable for new bookings.", 400);
    }

    // Prevent customer from booking themselves
    if (customerId === workerId) {
      return sendError(res, "You cannot book your own services.", 400);
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return sendError(res, "Invalid start date format.", 400);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedStartDate < today) {
      return sendError(res, "Start date cannot be in the past.", 400);
    }

    const daysCount = parseInt(totalDays, 10);
    if (isNaN(daysCount) || daysCount < 1 || daysCount > 90) {
      return sendError(res, "Total days must be a number between 1 and 90.", 400);
    }

    const dailyRate = worker.workerProfile.dailyRate || 800;
    const totalAmount = dailyRate * daysCount;

    // Generate unique booking number e.g. MD-2026-928371
    const uniqueSuffix = Date.now().toString().slice(-6);
    const bookingNumber = `MD-${new Date().getFullYear()}-${uniqueSuffix}`;

    const parsedEndDate = endDate ? new Date(endDate) : new Date(parsedStartDate.getTime() + (daysCount - 1) * 86400000);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId,
        workerId,
        serviceCategory: serviceCategory || worker.workerProfile.category || "General Labour",
        status: "REQUESTED",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        dailyRate,
        totalDays: daysCount,
        totalAmount,
        address: address.trim(),
        city: city.trim(),
        notes: notes?.trim() || null,
        statusHistory: {
          create: {
            status: "REQUESTED",
            note: "Customer submitted booking request",
            changedBy: req.user!.name,
          },
        },
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            workerProfile: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
          },
        },
        statusHistory: true,
      },
    });

    // Notify the worker of the new hiring request
    await NotificationService.createNotification({
      userId: workerId,
      title: "New Booking Request",
      message: `${req.user!.name} requested your services (${booking.serviceCategory}) starting ${parsedStartDate.toLocaleDateString("en-IN")}. Ref: ${bookingNumber}`,
      type: "BOOKING_REQUEST",
      link: `/dashboard/worker/bookings`,
      bookingId: booking.id,
      relatedUserId: customerId,
    });

    // Notify customer confirmation
    await NotificationService.createNotification({
      userId: customerId,
      title: "Booking Submitted",
      message: `Your booking request ${bookingNumber} for ${worker.name} has been dispatched.`,
      type: "BOOKING_REQUEST",
      link: `/dashboard/customer/bookings/${booking.id}`,
      bookingId: booking.id,
      relatedUserId: workerId,
    });

    return sendSuccess(res, booking, "Booking request created successfully", 201);
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. GET /api/bookings - List bookings for authenticated user
// ========================================================
router.get("/bookings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * pageSize;

    const whereClause: any = {};

    // Role-based scoping (Customer only sees their bookings, Worker sees theirs)
    if (userRole === "CUSTOMER") {
      whereClause.customerId = userId;
    } else if (userRole === "WORKER") {
      whereClause.workerId = userId;
    } else if (userRole !== "ADMIN") {
      whereClause.customerId = userId;
    }

    if (status && typeof status === "string" && status.trim() !== "ALL") {
      whereClause.status = status.trim().toUpperCase();
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where: whereClause }),
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
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
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
          reviews: true,
          invoices: true,
          payments: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return sendSuccess(
      res,
      {
        bookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          pageSize,
          totalResults: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Bookings retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. GET /api/bookings/:id - Single booking details (IDOR Protected)
// ========================================================
router.get("/bookings/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
            workerProfile: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
            customerProfile: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        reviews: true,
        invoices: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      return sendError(res, "Booking record not found", 404);
    }

    // IDOR Protection: only booking participants or admin can view
    if (booking.customerId !== userId && booking.workerId !== userId && userRole !== "ADMIN") {
      return sendError(res, "Access denied. You do not have permission to view this booking.", 403);
    }

    return sendSuccess(res, booking, "Booking details retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. PATCH /api/bookings/:id/cancel - Cancel eligible booking
// ========================================================
router.patch("/bookings/:id/cancel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason = "Cancelled by user" } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return sendError(res, "Booking not found", 404);
    }

    // IDOR Check
    if (booking.customerId !== userId && booking.workerId !== userId && userRole !== "ADMIN") {
      return sendError(res, "You are not authorized to cancel this booking.", 403);
    }

    // Check cancellation eligibility
    if (!["REQUESTED", "ACCEPTED", "CONFIRMED"].includes(booking.status)) {
      return sendError(
        res,
        `Cannot cancel booking in '${booking.status}' status. Only pending or confirmed requests may be cancelled.`,
        400
      );
    }

    const cancelUpdateData: any = {
      status: "CANCELLED",
      statusHistory: {
        create: {
          status: "CANCELLED",
          note:
            booking.paymentStatus === "PAID"
              ? `${reason} (Paid booking cancelled — eligible for Razorpay Test Refund)`
              : reason,
          changedBy: req.user!.name,
        },
      },
    };

    if (booking.paymentStatus === "PAID") {
      cancelUpdateData.paymentStatus = "REFUND_PENDING";
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: cancelUpdateData,
      include: {
        statusHistory: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    // Notify the other party
    const targetUserId = userId === booking.customerId ? booking.workerId : booking.customerId;
    await NotificationService.createNotification({
      userId: targetUserId,
      title: "Booking Cancelled",
      message: `Booking ${booking.bookingNumber} was cancelled. Reason: ${reason}`,
      type: "BOOKING_CANCELLED",
      link: `/dashboard/${userRole === "CUSTOMER" ? "worker" : "customer"}/bookings`,
      bookingId: booking.id,
      relatedUserId: userId,
    });

    return sendSuccess(res, updatedBooking, "Booking cancelled successfully");
  } catch (error) {
    next(error);
  }
});

// Valid state machine transitions for bookings
const VALID_BOOKING_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "IN_PROGRESS", "CANCELLED", "REJECTED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  DISPUTED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

// ========================================================
// 5. PATCH /api/bookings/:id/accept - Worker accepts booking request
// ========================================================
router.patch("/bookings/:id/accept", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, worker: true },
    });

    if (!booking) {
      return sendError(res, "Booking record not found", 404);
    }

    if (booking.workerId !== userId && userRole !== "ADMIN") {
      return sendError(res, "Only the assigned worker or administrator can accept this booking.", 403);
    }

    if (booking.status !== "REQUESTED") {
      return sendError(res, `Cannot accept booking with status '${booking.status}'. It must be in 'REQUESTED' status.`, 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        statusHistory: {
          create: {
            status: "ACCEPTED",
            note: note || "Worker accepted booking request",
            changedBy: req.user!.name,
          },
        },
      },
      include: {
        statusHistory: true,
        worker: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    await NotificationService.createNotification({
      userId: booking.customerId,
      title: "Booking Accepted",
      message: `Artisan ${booking.worker.name} has accepted your booking request (${booking.bookingNumber}).`,
      type: "BOOKING_ACCEPTED",
      link: `/dashboard/customer/bookings/${id}`,
      bookingId: booking.id,
      relatedUserId: booking.workerId,
    });

    return sendSuccess(res, updatedBooking, "Booking successfully accepted");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 6. PATCH /api/bookings/:id/reject - Worker rejects booking request
// ========================================================
router.patch("/bookings/:id/reject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, worker: true },
    });

    if (!booking) {
      return sendError(res, "Booking record not found", 404);
    }

    if (booking.workerId !== userId && userRole !== "ADMIN") {
      return sendError(res, "Only the assigned worker or administrator can decline this booking.", 403);
    }

    if (!["REQUESTED", "ACCEPTED"].includes(booking.status)) {
      return sendError(res, `Cannot decline booking in '${booking.status}' status.`, 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "REJECTED",
        statusHistory: {
          create: {
            status: "REJECTED",
            note: reason || note || "Worker declined booking request",
            changedBy: req.user!.name,
          },
        },
      },
      include: {
        statusHistory: true,
        worker: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
      },
    });

    await NotificationService.createNotification({
      userId: booking.customerId,
      title: "Booking Declined",
      message: `Artisan ${booking.worker.name} was unable to accept booking ${booking.bookingNumber}. Reason: ${reason || "Unavailable on requested dates"}`,
      type: "BOOKING_REJECTED",
      link: `/dashboard/customer/bookings`,
      bookingId: booking.id,
      relatedUserId: booking.workerId,
    });

    return sendSuccess(res, updatedBooking, "Booking declined");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 7. PATCH /api/bookings/:id/status - Status transitions (Worker/Admin lifecycle)
// ========================================================
router.patch("/bookings/:id/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!status || !["ACCEPTED", "REJECTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "DISPUTED"].includes(status)) {
      return sendError(res, "Invalid booking status transition requested.", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        worker: true,
        customer: true,
      },
    });

    if (!booking) {
      return sendError(res, "Booking not found", 404);
    }

    // State machine validation
    const validAllowed = VALID_BOOKING_TRANSITIONS[booking.status] || [];
    if (!validAllowed.includes(status)) {
      return sendError(
        res,
        `Invalid status transition from '${booking.status}' to '${status}'.`,
        400
      );
    }

    // Role-based authorization check
    if (status === "DISPUTED") {
      if (booking.workerId !== userId && booking.customerId !== userId && userRole !== "ADMIN") {
        return sendError(res, "You are not authorized to dispute this booking.", 403);
      }
    } else {
      if (booking.workerId !== userId && userRole !== "ADMIN") {
        return sendError(res, "Only the assigned worker or administrator can update booking execution status.", 403);
      }
    }

    const updateData: any = {
      status,
      statusHistory: {
        create: {
          status,
          note: note || `Status updated to ${status} by ${req.user!.name}`,
          changedBy: req.user!.name,
        },
      },
    };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.completionNotes = note || "Work completed satisfactorily.";
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        statusHistory: true,
        invoices: true,
      },
    });

    // Auto-generate official invoice upon completion if one doesn't exist
    if (status === "COMPLETED") {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { bookingId: id },
      });

      if (!existingInvoice) {
        const invSuffix = Date.now().toString().slice(-7);
        const invoiceNumber = `INV-${new Date().getFullYear()}-${invSuffix}`;

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: id,
            amount: booking.totalAmount,
            taxAmount: 0,
            totalAmount: booking.totalAmount,
            paidAt: new Date(),
          },
        });
      }

      // Increment worker's completed jobs counter
      await prisma.workerProfile.updateMany({
        where: { userId: booking.workerId },
        data: {
          completedJobs: { increment: 1 },
        },
      });

      // Notify customer that work is completed and invoice is ready
      await NotificationService.createNotification({
        userId: booking.customerId,
        title: "Work Completed & Invoice Available",
        message: `Artisan ${booking.worker.name} completed work on booking ${booking.bookingNumber}. Your verified invoice is ready for download!`,
        type: "WORK_COMPLETED",
        link: `/dashboard/customer/invoices`,
        bookingId: booking.id,
        relatedUserId: booking.workerId,
      });
    } else if (status === "IN_PROGRESS") {
      // Notify customer that work has started
      await NotificationService.createNotification({
        userId: booking.customerId,
        title: "Work Started",
        message: `Artisan ${booking.worker.name} has begun work on booking ${booking.bookingNumber}.`,
        type: "WORK_STARTED",
        link: `/dashboard/customer/bookings/${id}`,
        bookingId: booking.id,
        relatedUserId: booking.workerId,
      });
    } else {
      // General status notification for customer
      await NotificationService.createNotification({
        userId: booking.customerId,
        title: `Booking Update: ${status}`,
        message: `Your booking ${booking.bookingNumber} is now '${status}'.`,
        type: "BOOKING_UPDATE",
        link: `/dashboard/customer/bookings/${id}`,
        bookingId: booking.id,
        relatedUserId: booking.workerId,
      });
    }

    return sendSuccess(res, updatedBooking, `Booking status successfully changed to ${status}`);
  } catch (error) {
    next(error);
  }
});

export default router;

