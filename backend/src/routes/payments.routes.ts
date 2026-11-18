import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../config/prisma";
import { authenticateUser } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { PaymentService, PaymentServiceError } from "../services/payment.service";

const router = Router();

// Dedicated rate limiter for sensitive payment mutation routes
const paymentMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment requests from this IP. Please try again shortly.",
  },
});

function handlePaymentError(res: Response, error: unknown, next: NextFunction) {
  if (error instanceof PaymentServiceError) {
    return sendError(res, error.message, error.statusCode, error.code);
  }
  return next(error);
}

// ========================================================
// 1. POST /api/payments/webhook - Public Razorpay Webhook (HMAC-SHA256 Verified)
// ========================================================
router.post("/payments/webhook", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    const eventIdHeader = (req.headers["x-razorpay-event-id"] as string) || undefined;
    const rawBody: Buffer | string =
      (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}), "utf8");

    if (!signature) {
      return sendError(res, "Missing x-razorpay-signature header.", 400);
    }

    const result = await PaymentService.processWebhook({
      rawBody,
      signature,
      eventIdHeader,
      body: req.body,
    });

    return sendSuccess(res, result, "Webhook processed successfully", 200);
  } catch (error) {
    return handlePaymentError(res, error, next);
  }
});

// All remaining payment endpoints require valid JWT authentication
router.use("/payments", authenticateUser);

// ========================================================
// 2. GET /api/payments/config - Public Checkout Config (Test Mode)
// ========================================================
router.get("/payments/config", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = PaymentService.getPublicConfig();
    return sendSuccess(res, config, "Razorpay payment configuration retrieved");
  } catch (error) {
    return handlePaymentError(res, error, next);
  }
});

// ========================================================
// 3. POST /api/payments/create-order - Create Razorpay Test Order
// ========================================================
router.post(
  "/payments/create-order",
  paymentMutationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.body || {};

      if (!bookingId || typeof bookingId !== "string") {
        return sendError(res, "bookingId is required to create a payment order.", 400);
      }

      const result = await PaymentService.createOrder({
        bookingId: bookingId.trim(),
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      return sendSuccess(res, result, "Razorpay Test Mode order created successfully", 201);
    } catch (error) {
      return handlePaymentError(res, error, next);
    }
  }
);

// ========================================================
// 4. POST /api/payments/sandbox/authorize - Local Test Sandbox Checkout Helper
// ========================================================
router.post(
  "/payments/sandbox/authorize",
  paymentMutationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpayOrderId, paymentMethod } = req.body || {};
      const orderId = (razorpay_order_id || razorpayOrderId || "").trim();

      if (!orderId) {
        return sendError(res, "razorpay_order_id is required.", 400);
      }

      const payload = await PaymentService.authorizeSandboxPayment({
        razorpayOrderId: orderId,
        paymentMethod,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      return sendSuccess(res, payload, "Sandbox test authorization generated");
    } catch (error) {
      return handlePaymentError(res, error, next);
    }
  }
);

// ========================================================
// 5. POST /api/payments/verify - Verify HMAC-SHA256 Razorpay Payment
// ========================================================
router.post(
  "/payments/verify",
  paymentMutationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentMethod,
      } = req.body || {};

      const orderId = (razorpay_order_id || razorpayOrderId || "").trim();
      const paymentId = (razorpay_payment_id || razorpayPaymentId || "").trim();
      const signature = (razorpay_signature || razorpaySignature || "").trim();

      const result = await PaymentService.verifyPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        paymentMethod,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      return sendSuccess(
        res,
        result,
        result.alreadyVerified
          ? "Payment was already verified"
          : "Payment verified and booking confirmed"
      );
    } catch (error) {
      return handlePaymentError(res, error, next);
    }
  }
);

// ========================================================
// 6. POST /api/payments/fail - Record Failed / Cancelled Checkout Attempt
// ========================================================
router.post(
  "/payments/fail",
  paymentMutationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpayOrderId, failureCode, failureReason } = req.body || {};
      const orderId = (razorpay_order_id || razorpayOrderId || "").trim();

      if (!orderId) {
        return sendError(res, "razorpay_order_id is required.", 400);
      }

      const payment = await PaymentService.markPaymentFailed({
        razorpayOrderId: orderId,
        failureCode,
        failureReason,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
        source: "API",
      });

      return sendSuccess(res, payment, "Payment failure recorded. You may retry payment.");
    } catch (error) {
      return handlePaymentError(res, error, next);
    }
  }
);

// ========================================================
// 7. GET /api/payments - Paginated Role-Scoped Payment History + Summary
// ========================================================
router.get("/payments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status, page = "1", limit = "15" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 15));
    const skip = (pageNum - 1) * pageSize;

    const baseScope: any = {};
    if (userRole === "WORKER") {
      baseScope.workerId = userId;
    } else if (userRole !== "ADMIN") {
      baseScope.userId = userId;
    }

    const whereClause: any = { ...baseScope };
    if (status && typeof status === "string" && status.trim().toUpperCase() !== "ALL") {
      whereClause.status = status.trim().toUpperCase();
    }

    const [total, payments, allScopedPayments] = await Promise.all([
      prisma.payment.count({ where: whereClause }),
      prisma.payment.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              serviceCategory: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
              startDate: true,
              city: true,
              worker: {
                select: { id: true, name: true, phone: true, avatar: true },
              },
              customer: {
                select: { id: true, name: true, phone: true, avatar: true },
              },
              invoices: {
                select: { id: true, invoiceNumber: true, paidAt: true },
              },
            },
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.payment.findMany({
        where: baseScope,
        select: {
          status: true,
          amount: true,
          refundAmount: true,
        },
      }),
    ]);

    const summary = allScopedPayments.reduce(
      (acc, p) => {
        if (p.status === "SUCCESS") {
          acc.totalPaidAmount += p.amount;
          acc.successfulCount += 1;
        } else if (p.status === "PENDING") {
          acc.pendingAmount += p.amount;
          acc.pendingCount += 1;
        } else if (p.status === "FAILED") {
          acc.failedCount += 1;
        } else if (p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED") {
          acc.totalRefundedAmount += p.refundAmount || p.amount;
          acc.refundedCount += 1;
          if (p.status === "PARTIALLY_REFUNDED") {
            acc.totalPaidAmount += Math.max(0, p.amount - (p.refundAmount || 0));
          }
        }
        return acc;
      },
      {
        totalPaidAmount: 0,
        pendingAmount: 0,
        totalRefundedAmount: 0,
        successfulCount: 0,
        pendingCount: 0,
        failedCount: 0,
        refundedCount: 0,
        totalTransactions: allScopedPayments.length,
        currency: "INR",
      }
    );

    const totalPages = Math.ceil(total / pageSize);

    return sendSuccess(
      res,
      {
        payments,
        summary,
        pagination: {
          currentPage: pageNum,
          totalPages,
          pageSize,
          totalResults: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      "Payment history retrieved successfully"
    );
  } catch (error) {
    return handlePaymentError(res, error, next);
  }
});

// ========================================================
// 8. GET /api/payments/booking/:bookingId - Booking Payment Status & Attempts
// ========================================================
router.get("/payments/booking/:bookingId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        customerId: true,
        workerId: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        paidAmount: true,
        paidAt: true,
      },
    });

    if (!booking) {
      return sendError(res, "Booking not found.", 404);
    }

    if (booking.customerId !== userId && booking.workerId !== userId && userRole !== "ADMIN") {
      return sendError(res, "Access denied to this booking's payment records.", 403);
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
      include: {
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    return sendSuccess(
      res,
      {
        booking,
        payments,
        latestPayment: payments[0] || null,
      },
      "Booking payment details retrieved"
    );
  } catch (error) {
    return handlePaymentError(res, error, next);
  }
});

// ========================================================
// 9. GET /api/payments/:id - Single Payment Record & Audit Trail (IDOR Protected)
// ========================================================
router.get("/payments/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true, phone: true, email: true } },
            worker: { select: { id: true, name: true, phone: true } },
            invoices: true,
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!payment) {
      return sendError(res, "Payment record not found.", 404);
    }

    const isParticipant =
      payment.userId === userId ||
      payment.workerId === userId ||
      payment.booking?.customerId === userId ||
      payment.booking?.workerId === userId;

    if (!isParticipant && userRole !== "ADMIN") {
      return sendError(res, "Access denied. You do not have permission to view this payment.", 403);
    }

    return sendSuccess(res, payment, "Payment details retrieved successfully");
  } catch (error) {
    return handlePaymentError(res, error, next);
  }
});

// ========================================================
// 10. POST /api/payments/:id/refund - Initiate Full/Partial Test Refund
// ========================================================
router.post(
  "/payments/:id/refund",
  paymentMutationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body || {};

      const refundedPayment = await PaymentService.initiateRefund({
        paymentId: id,
        amount: amount !== undefined ? Number(amount) : undefined,
        reason,
        actorUserId: req.user!.id,
        actorRole: req.user!.role,
      });

      return sendSuccess(res, refundedPayment, "Refund processed successfully in Test Mode");
    } catch (error) {
      return handlePaymentError(res, error, next);
    }
  }
);

export default router;
