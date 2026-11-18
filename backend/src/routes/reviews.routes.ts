import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { NotificationService } from "../services/notification.service";

const router = Router();

// ========================================================
// 1. GET /api/reviews - Public or authenticated review listing
// ========================================================
router.get("/reviews", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId, customerId, bookingId, limit = "20" } = req.query;

    const whereClause: any = {};

    if (workerId && typeof workerId === "string") {
      whereClause.targetUserId = workerId;
    }
    if (customerId && typeof customerId === "string") {
      whereClause.reviewerId = customerId;
    }
    if (bookingId && typeof bookingId === "string") {
      whereClause.bookingId = bookingId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      take: Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)),
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            bookingNumber: true,
            serviceCategory: true,
            completedAt: true,
          },
        },
      },
    });

    return sendSuccess(res, reviews, "Reviews retrieved successfully");
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. POST /api/reviews - Submit review for completed booking
// ========================================================
router.post("/reviews", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return sendError(res, "Booking ID is required.", 400);
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return sendError(res, "Rating must be an integer between 1 and 5 stars.", 400);
    }

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return sendError(res, "Booking record not found.", 404);
    }

    // Verify ownership: only the customer who booked the service can submit a review
    if (booking.customerId !== customerId && req.user!.role !== "ADMIN") {
      return sendError(res, "Unauthorized. Only the customer who hired the worker may post a review.", 403);
    }

    // Verify completion: review can ONLY be submitted once work is completed
    if (booking.status !== "COMPLETED") {
      return sendError(
        res,
        `Cannot review an incomplete booking. Current status is '${booking.status}'. Reviews require COMPLETED status.`,
        400
      );
    }

    // Prevent duplicate reviews for the same booking
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        reviewerId: customerId,
      },
    });

    if (existingReview) {
      return sendError(res, "You have already submitted a review for this booking.", 409);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: customerId,
        targetUserId: booking.workerId,
        rating: parsedRating,
        comment: comment?.trim() || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Recompute worker's true average rating & total reviews
    const allWorkerReviews = await prisma.review.findMany({
      where: { targetUserId: booking.workerId },
      select: { rating: true },
    });

    const totalCount = allWorkerReviews.length;
    const totalScore = allWorkerReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Math.round((totalScore / totalCount) * 10) / 10;

    await prisma.workerProfile.updateMany({
      where: { userId: booking.workerId },
      data: {
        rating: newAverage,
        totalReviews: totalCount,
      },
    });

    // Send notification to worker
    await NotificationService.createNotification({
      userId: booking.workerId,
      title: "New Review Received",
      message: `${req.user!.name} rated your service ${parsedRating}/5 stars for booking ${booking.bookingNumber}.`,
      type: "NEW_REVIEW",
      link: `/workers/${booking.workerId}`,
      bookingId: booking.id,
      relatedUserId: customerId,
    });

    return sendSuccess(res, review, "Review submitted successfully and worker rating updated", 201);
  } catch (error) {
    next(error);
  }
});

export default router;

