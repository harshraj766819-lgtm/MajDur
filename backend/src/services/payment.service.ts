import crypto from "crypto";
import Razorpay from "razorpay";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "../config/prisma";
import { ENV } from "../config/environment";
import { NotificationService } from "./notification.service";

let ioInstance: SocketIOServer | null = null;

export function setPaymentSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export type PaymentRuntimeMode = "TEST" | "SANDBOX";

export interface GatewayRuntimeConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  mode: PaymentRuntimeMode;
  isSandbox: boolean;
  isTestMode: boolean;
}

const PLACEHOLDER_REGEX = /placeholder|your_|xxxx|dummy|demo|change_me|replace_me/i;

function isPlaceholderCredential(val: string): boolean {
  if (!val || val.trim().length < 8) return true;
  return PLACEHOLDER_REGEX.test(val);
}

/**
 * Resolves the Razorpay gateway runtime mode with a hard safety guard
 * preventing accidental live credentials / real transactions.
 */
export function getGatewayRuntimeConfig(): GatewayRuntimeConfig {
  const rawKeyId = (ENV.RAZORPAY_KEY_ID || "").trim();
  const rawKeySecret = (ENV.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecret = (ENV.RAZORPAY_WEBHOOK_SECRET || rawKeySecret || "majdur-razorpay-test-webhook-secret-2026").trim();

  // Hard Safety Guard: Block live credentials unless explicitly allowed
  if (rawKeyId.startsWith("rzp_live_") && !ENV.ALLOW_LIVE_PAYMENTS) {
    throw new PaymentServiceError(
      "Live Razorpay credentials (rzp_live_*) are strictly blocked in Test Mode.",
      403,
      "LIVE_PAYMENTS_BLOCKED"
    );
  }

  const keysArePlaceholder =
    isPlaceholderCredential(rawKeyId) ||
    isPlaceholderCredential(rawKeySecret) ||
    rawKeySecret.toLowerCase() === "razorpay_test_secret" ||
    rawKeySecret.toLowerCase() === "test_secret";

  const forcedSandbox = ENV.RAZORPAY_MODE === "sandbox";
  const isSandbox = forcedSandbox || keysArePlaceholder || !rawKeyId.startsWith("rzp_test_");

  const effectiveKeyId = isSandbox
    ? rawKeyId && rawKeyId.startsWith("rzp_test_")
      ? rawKeyId
      : "rzp_test_MajDurSandbox"
    : rawKeyId;

  const effectiveSecret = isSandbox
    ? rawKeySecret || "majdur_razorpay_test_sandbox_secret_2026"
    : rawKeySecret;

  return {
    keyId: effectiveKeyId,
    keySecret: effectiveSecret,
    webhookSecret,
    mode: isSandbox ? "SANDBOX" : "TEST",
    isSandbox,
    isTestMode: true,
  };
}

export class PaymentServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "PAYMENT_ERROR") {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function constantTimeHexEquals(expectedHex: string, providedHex: string): boolean {
  if (!expectedHex || !providedHex) return false;
  const a = Buffer.from(expectedHex.trim().toLowerCase(), "utf8");
  const b = Buffer.from(providedHex.trim().toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function emitPaymentUpdate(userIds: Array<string | null | undefined>, payload: Record<string, any>) {
  if (!ioInstance) return;
  const uniqueIds = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  for (const uid of uniqueIds) {
    try {
      ioInstance.to(`user:${uid}`).emit("payment:updated", payload);
    } catch (err) {
      console.error("[PaymentService] Socket emission failed (isolated):", err);
    }
  }
}

export const PaymentService = {
  /**
   * Public checkout configuration — NEVER exposes secrets.
   */
  getPublicConfig() {
    const cfg = getGatewayRuntimeConfig();
    return {
      keyId: cfg.keyId,
      mode: cfg.mode,
      isSandbox: cfg.isSandbox,
      isTestMode: cfg.isTestMode,
      currency: "INR",
      currencySymbol: "₹",
      testModeBanner:
        "Razorpay Test Mode Active — Simulated transactions only. No real money is charged.",
    };
  },

  /**
   * Computes authentic Razorpay HMAC-SHA256 checkout signature.
   */
  computeCheckoutSignature(razorpayOrderId: string, razorpayPaymentId: string): string {
    const cfg = getGatewayRuntimeConfig();
    return crypto
      .createHmac("sha256", cfg.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
  },

  /**
   * Verifies Razorpay HMAC-SHA256 checkout signature using constant-time comparison.
   */
  verifyCheckoutSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
    const expected = this.computeCheckoutSignature(razorpayOrderId, razorpayPaymentId);
    return constantTimeHexEquals(expected, razorpaySignature);
  },

  /**
   * Verifies Razorpay Webhook HMAC-SHA256 signature against raw payload bytes.
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!rawBody || !signature) return false;
    const cfg = getGatewayRuntimeConfig();
    const expected = crypto
      .createHmac("sha256", cfg.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return constantTimeHexEquals(expected, signature);
  },

  /**
   * Create a Razorpay Test Order for an eligible booking.
   * Server strictly computes the amount from MongoDB Booking.totalAmount.
   */
  async createOrder(params: {
    bookingId: string;
    actorUserId: string;
    actorRole: string;
  }) {
    const { bookingId, actorUserId, actorRole } = params;
    const cfg = getGatewayRuntimeConfig();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        worker: {
          select: { id: true, name: true, phone: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      throw new PaymentServiceError("Booking record not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Strict IDOR & RBAC protection
    if (booking.customerId !== actorUserId && actorRole !== "ADMIN") {
      throw new PaymentServiceError(
        "Only the booking customer or administrator can initiate payment for this booking.",
        403,
        "FORBIDDEN"
      );
    }

    // Booking lifecycle eligibility check
    const payableStatuses = ["ACCEPTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
    if (!payableStatuses.includes(booking.status)) {
      throw new PaymentServiceError(
        `Payment cannot be initiated while booking is in '${booking.status}' status. The artisan must accept the booking first.`,
        400,
        "BOOKING_NOT_PAYABLE"
      );
    }

    // Duplicate payment guard
    const existingSuccess = booking.payments.find((p) => p.status === "SUCCESS");
    if (booking.paymentStatus === "PAID" || existingSuccess) {
      throw new PaymentServiceError(
        "This booking has already been paid.",
        409,
        "ALREADY_PAID"
      );
    }

    // Strict server-side amount calculation (never trust client input)
    const amountInr = Number(booking.totalAmount);
    const amountPaise = Math.round(amountInr * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new PaymentServiceError(
        "Booking amount must be at least ₹1.00 to initiate Razorpay payment.",
        400,
        "INVALID_AMOUNT"
      );
    }

    const receiptSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const receiptNumber = `RCPT-${booking.bookingNumber}-${receiptSuffix}`.slice(0, 40);

    let razorpayOrderId: string;
    let gatewayResponse: Record<string, any> = {};

    if (cfg.mode === "TEST") {
      const razorpay = new Razorpay({
        key_id: cfg.keyId,
        key_secret: cfg.keySecret,
      });

      const rzpOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: receiptNumber,
        notes: {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          customerId: booking.customerId,
          workerId: booking.workerId,
          platform: "MajDur",
          mode: "TEST",
        },
      });
      razorpayOrderId = rzpOrder.id;
      gatewayResponse = rzpOrder as Record<string, any>;
    } else {
      // Razorpay Test Mode Sandbox Adapter (when placeholder test keys are used locally)
      razorpayOrderId = `order_TestMD${crypto.randomBytes(7).toString("hex")}`;
      gatewayResponse = {
        id: razorpayOrderId,
        entity: "order",
        amount: amountPaise,
        amount_paid: 0,
        amount_due: amountPaise,
        currency: "INR",
        receipt: receiptNumber,
        status: "created",
        mode: "SANDBOX",
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.customerId,
        workerId: booking.workerId,
        amount: amountInr,
        amountPaise,
        platformFee: 0,
        taxAmount: 0,
        currency: "INR",
        receiptNumber,
        razorpayOrderId,
        paymentMode: cfg.mode,
        status: "PENDING",
        notes: {
          bookingNumber: booking.bookingNumber,
          serviceCategory: booking.serviceCategory,
          gatewayOrderStatus: gatewayResponse.status || "created",
        },
      },
    });

    await Promise.all([
      prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "PENDING" },
      }),
      prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "ORDER_CREATED",
          source: "API",
          payload: {
            razorpayOrderId,
            amountInr,
            amountPaise,
            receiptNumber,
            mode: cfg.mode,
          },
        },
      }),
    ]);

    return {
      payment,
      checkout: {
        keyId: cfg.keyId,
        orderId: razorpayOrderId,
        amount: amountPaise,
        amountInr,
        currency: "INR",
        name: "MajDur (मजदूर)",
        description: `${booking.serviceCategory} • ${booking.bookingNumber}`,
        receipt: receiptNumber,
        mode: cfg.mode,
        isSandbox: cfg.isSandbox,
        isTestMode: true,
        prefill: {
          name: booking.customer.name,
          email: booking.customer.email || "",
          contact: booking.customer.phone,
        },
        theme: {
          color: "#D4AF37",
        },
      },
    };
  },

  /**
   * Generates a valid Razorpay Test Mode Sandbox payment authorization token
   * when running in local Sandbox mode (disabled if real live mode).
   */
  async authorizeSandboxPayment(params: {
    razorpayOrderId: string;
    paymentMethod?: string;
    actorUserId: string;
    actorRole: string;
  }) {
    const cfg = getGatewayRuntimeConfig();
    if (!cfg.isSandbox) {
      throw new PaymentServiceError(
        "Sandbox authorization is only available in local Razorpay Test Sandbox mode.",
        403,
        "SANDBOX_DISABLED"
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (payment.userId !== params.actorUserId && params.actorRole !== "ADMIN") {
      throw new PaymentServiceError("Unauthorized to authorize this payment.", 403, "FORBIDDEN");
    }

    if (payment.status === "SUCCESS") {
      throw new PaymentServiceError("Payment order is already settled.", 409, "ALREADY_PAID");
    }

    const razorpayPaymentId = `pay_TestMD${crypto.randomBytes(7).toString("hex")}`;
    const razorpaySignature = this.computeCheckoutSignature(
      params.razorpayOrderId,
      razorpayPaymentId
    );

    return {
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      paymentMethod: (params.paymentMethod || "UPI").toUpperCase(),
      mode: "SANDBOX",
    };
  },

  /**
   * Core settlement helper shared by checkout verification and webhook capture.
   */
  async finalizeSuccessfulPayment(params: {
    paymentId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string | null;
    paymentMethod?: string;
    source: "API" | "WEBHOOK";
    webhookEventId?: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true } },
            worker: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment record not found.", 404, "PAYMENT_NOT_FOUND");
    }

    // Idempotent return if already settled with the exact same paymentId
    if (payment.status === "SUCCESS") {
      if (payment.razorpayPaymentId === params.razorpayPaymentId) {
        const invoice = payment.bookingId
          ? await prisma.invoice.findFirst({ where: { bookingId: payment.bookingId } })
          : null;
        return {
          payment,
          booking: payment.booking,
          invoice,
          alreadyVerified: true,
        };
      }
      throw new PaymentServiceError(
        "This order is already settled under a different payment reference.",
        409,
        "DUPLICATE_PAYMENT_CONFLICT"
      );
    }

    // Guard against reusing the same razorpayPaymentId across two different orders
    const duplicatePaymentId = await prisma.payment.findFirst({
      where: {
        razorpayPaymentId: params.razorpayPaymentId,
        id: { not: payment.id },
      },
    });
    if (duplicatePaymentId) {
      throw new PaymentServiceError(
        "This Razorpay payment ID has already been applied to another order.",
        409,
        "PAYMENT_ID_REUSED"
      );
    }

    const now = new Date();
    const normalizedMethod = (params.paymentMethod || "UPI").toUpperCase();

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature || payment.razorpaySignature,
        paymentMethod: normalizedMethod,
        verifiedAt: now,
        failureCode: null,
        failureReason: null,
      },
    });

    let updatedBooking = payment.booking;
    let invoiceRecord = null;

    if (payment.booking) {
      const booking = payment.booking;
      const shouldConfirm = booking.status === "ACCEPTED";

      const bookingUpdateData: any = {
        paymentStatus: "PAID",
        paidAmount: payment.amount,
        paidAt: now,
      };

      if (shouldConfirm) {
        bookingUpdateData.status = "CONFIRMED";
        bookingUpdateData.statusHistory = {
          create: {
            status: "CONFIRMED",
            note: `Payment verified via Razorpay Test Mode (${params.razorpayPaymentId}). Booking confirmed.`,
            changedBy: "MajDur Payment System",
          },
        };
      }

      updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: bookingUpdateData,
        include: {
          customer: { select: { id: true, name: true } },
          worker: { select: { id: true, name: true } },
        },
      });

      // Sync or auto-create verified Tax Invoice / Receipt
      const existingInvoice = await prisma.invoice.findFirst({
        where: { bookingId: booking.id },
      });

      if (existingInvoice) {
        invoiceRecord = await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            paidAt: now,
            paymentId: payment.id,
            razorpayPaymentId: params.razorpayPaymentId,
            paymentMethod: normalizedMethod,
          },
        });
      } else {
        const invSuffix = `${Date.now().toString().slice(-6)}${crypto.randomInt(10, 99)}`;
        const invoiceNumber = `INV-${now.getFullYear()}-${invSuffix}`;
        invoiceRecord = await prisma.invoice.create({
          data: {
            invoiceNumber,
            bookingId: booking.id,
            paymentId: payment.id,
            razorpayPaymentId: params.razorpayPaymentId,
            paymentMethod: normalizedMethod,
            amount: booking.totalAmount,
            taxAmount: 0,
            totalAmount: booking.totalAmount,
            paidAt: now,
          },
        });
      }

      // Send real-time notifications to both Customer and Worker
      await Promise.all([
        NotificationService.createNotification({
          userId: booking.customerId,
          title: "Payment Successful",
          message: `Payment of ₹${payment.amount.toLocaleString("en-IN")} for booking ${booking.bookingNumber} was verified (Ref: ${params.razorpayPaymentId}).`,
          type: "PAYMENT_SUCCESS",
          link: `/dashboard/customer/bookings/${booking.id}`,
          bookingId: booking.id,
          relatedUserId: booking.workerId,
        }),
        NotificationService.createNotification({
          userId: booking.workerId,
          title: "Booking Payment Received",
          message: `Customer ${booking.customer.name} paid ₹${payment.amount.toLocaleString("en-IN")} for booking ${booking.bookingNumber}. Contract is confirmed!`,
          type: "PAYMENT_RECEIVED",
          link: `/dashboard/worker/bookings`,
          bookingId: booking.id,
          relatedUserId: booking.customerId,
        }),
      ]);

      emitPaymentUpdate([booking.customerId, booking.workerId], {
        type: "PAYMENT_SUCCESS",
        paymentId: updatedPayment.id,
        bookingId: booking.id,
        bookingStatus: updatedBooking.status,
        paymentStatus: "PAID",
        razorpayPaymentId: params.razorpayPaymentId,
        amount: payment.amount,
      });
    }

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventId: params.webhookEventId || null,
        eventType: params.source === "WEBHOOK" ? "WEBHOOK_CAPTURED" : "PAYMENT_VERIFIED",
        source: params.source,
        payload: {
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: params.razorpayPaymentId,
          paymentMethod: normalizedMethod,
          amount: payment.amount,
          invoiceNumber: invoiceRecord?.invoiceNumber || null,
        },
      },
    });

    return {
      payment: updatedPayment,
      booking: updatedBooking,
      invoice: invoiceRecord,
      alreadyVerified: false,
    };
  },

  /**
   * Verify Razorpay Checkout payment callback from frontend.
   */
  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
    actorUserId: string;
    actorRole: string;
  }) {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
      actorUserId,
      actorRole,
    } = params;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new PaymentServiceError(
        "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        400,
        "MISSING_VERIFICATION_FIELDS"
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (payment.userId !== actorUserId && actorRole !== "ADMIN") {
      throw new PaymentServiceError(
        "You are not authorized to verify this payment.",
        403,
        "FORBIDDEN"
      );
    }

    // Cryptographic HMAC-SHA256 verification
    const isValid = this.verifyCheckoutSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      await prisma.paymentEvent.create({
        data: {
          paymentId: payment.id,
          eventType: "SIGNATURE_REJECTED",
          source: "API",
          payload: {
            razorpayOrderId,
            razorpayPaymentId,
            actorUserId,
          },
        },
      });
      throw new PaymentServiceError(
        "Payment signature verification failed. Transaction was not confirmed.",
        400,
        "INVALID_SIGNATURE"
      );
    }

    return this.finalizeSuccessfulPayment({
      paymentId: payment.id,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
      source: "API",
    });
  },

  /**
   * Record a failed or cancelled Razorpay checkout attempt so the customer can retry cleanly.
   */
  async markPaymentFailed(params: {
    razorpayOrderId: string;
    failureCode?: string;
    failureReason?: string;
    actorUserId?: string;
    actorRole?: string;
    source: "API" | "WEBHOOK";
    webhookEventId?: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: { booking: true },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (
      params.source === "API" &&
      payment.userId !== params.actorUserId &&
      params.actorRole !== "ADMIN"
    ) {
      throw new PaymentServiceError("Unauthorized to update this payment.", 403, "FORBIDDEN");
    }

    if (payment.status === "SUCCESS" || payment.status === "REFUNDED") {
      throw new PaymentServiceError(
        "Cannot mark a settled or refunded payment as failed.",
        409,
        "INVALID_PAYMENT_STATE"
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureCode: params.failureCode || "PAYMENT_FAILED",
        failureReason: params.failureReason || "Transaction could not be completed.",
      },
    });

    if (payment.booking && payment.booking.paymentStatus !== "PAID") {
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: { paymentStatus: "FAILED" },
      });

      await NotificationService.createNotification({
        userId: payment.userId,
        title: "Payment Failed",
        message: `Payment attempt for booking ${payment.booking.bookingNumber} failed (${updatedPayment.failureReason}). You can safely retry payment.`,
        type: "PAYMENT_FAILED",
        link: `/dashboard/customer/bookings/${payment.booking.id}`,
        bookingId: payment.booking.id,
      });

      emitPaymentUpdate([payment.userId, payment.workerId], {
        type: "PAYMENT_FAILED",
        paymentId: updatedPayment.id,
        bookingId: payment.booking.id,
        paymentStatus: "FAILED",
      });
    }

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventId: params.webhookEventId || null,
        eventType: params.source === "WEBHOOK" ? "WEBHOOK_FAILED" : "PAYMENT_FAILED",
        source: params.source,
        payload: {
          razorpayOrderId: params.razorpayOrderId,
          failureCode: updatedPayment.failureCode,
          failureReason: updatedPayment.failureReason,
        },
      },
    });

    return updatedPayment;
  },

  /**
   * Initiate full or partial refund for a settled payment in Razorpay Test Mode.
   */
  async initiateRefund(params: {
    paymentId: string;
    amount?: number;
    reason?: string;
    actorUserId: string;
    actorRole: string;
  }) {
    const cfg = getGatewayRuntimeConfig();

    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, name: true } },
            worker: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new PaymentServiceError("Payment record not found.", 404, "PAYMENT_NOT_FOUND");
    }

    const isAdmin = params.actorRole === "ADMIN";
    const isOwner = payment.userId === params.actorUserId;
    const bookingAllowsCustomerRefund =
      payment.booking && ["CANCELLED", "DISPUTED"].includes(payment.booking.status);

    if (!isAdmin && !(isOwner && bookingAllowsCustomerRefund)) {
      throw new PaymentServiceError(
        "Refunds can only be initiated by an administrator, or by the customer after the booking is cancelled or disputed.",
        403,
        "REFUND_FORBIDDEN"
      );
    }

    if (payment.status !== "SUCCESS") {
      throw new PaymentServiceError(
        `Cannot refund payment in '${payment.status}' status. Only successful payments are eligible for refund.`,
        400,
        "NOT_REFUNDABLE"
      );
    }

    const refundAmountInr =
      params.amount !== undefined && params.amount !== null
        ? Number(params.amount)
        : payment.amount;

    if (
      !Number.isFinite(refundAmountInr) ||
      refundAmountInr <= 0 ||
      refundAmountInr > payment.amount
    ) {
      throw new PaymentServiceError(
        `Refund amount must be between ₹1 and ₹${payment.amount}.`,
        400,
        "INVALID_REFUND_AMOUNT"
      );
    }

    const refundPaise = Math.round(refundAmountInr * 100);
    const refundReason = (params.reason || "Booking cancelled — test mode refund").trim();
    const isFullRefund = Math.abs(refundAmountInr - payment.amount) < 0.01;

    let refundId: string;

    if (cfg.mode === "TEST" && payment.razorpayPaymentId) {
      const razorpay = new Razorpay({
        key_id: cfg.keyId,
        key_secret: cfg.keySecret,
      });
      const rzpRefund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: refundPaise,
        notes: {
          reason: refundReason,
          bookingId: payment.bookingId || "",
        },
      });
      refundId = rzpRefund.id;
    } else {
      refundId = `rfnd_TestMD${crypto.randomBytes(7).toString("hex")}`;
    }

    const now = new Date();
    const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        refundId,
        refundAmount: refundAmountInr,
        refundReason,
        refundedAt: now,
      },
    });

    if (payment.booking) {
      const remainingPaid = Math.max(0, Number((payment.booking.paidAmount - refundAmountInr).toFixed(2)));
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: {
          paymentStatus: newStatus,
          paidAmount: remainingPaid,
        },
      });

      await Promise.all([
        NotificationService.createNotification({
          userId: payment.booking.customerId,
          title: isFullRefund ? "Refund Processed" : "Partial Refund Processed",
          message: `Refund of ₹${refundAmountInr.toLocaleString("en-IN")} for booking ${payment.booking.bookingNumber} has been initiated (Ref: ${refundId}).`,
          type: "PAYMENT_REFUNDED",
          link: `/dashboard/customer/payments`,
          bookingId: payment.booking.id,
          relatedUserId: payment.booking.workerId,
        }),
        NotificationService.createNotification({
          userId: payment.booking.workerId,
          title: "Booking Refund Issued",
          message: `A refund of ₹${refundAmountInr.toLocaleString("en-IN")} was issued for cancelled booking ${payment.booking.bookingNumber}.`,
          type: "PAYMENT_REFUNDED",
          link: `/dashboard/worker/bookings`,
          bookingId: payment.booking.id,
          relatedUserId: payment.booking.customerId,
        }),
      ]);

      emitPaymentUpdate([payment.booking.customerId, payment.booking.workerId], {
        type: "PAYMENT_REFUNDED",
        paymentId: updatedPayment.id,
        bookingId: payment.booking.id,
        paymentStatus: newStatus,
        refundId,
        refundAmount: refundAmountInr,
      });
    }

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: "REFUND_COMPLETED",
        source: "API",
        payload: {
          refundId,
          refundAmount: refundAmountInr,
          isFullRefund,
          reason: refundReason,
          actorUserId: params.actorUserId,
        },
      },
    });

    return updatedPayment;
  },

  /**
   * Process incoming Razorpay Webhook with raw-body HMAC signature verification
   * and event-ID replay deduplication.
   */
  async processWebhook(params: {
    rawBody: Buffer | string;
    signature: string;
    eventIdHeader?: string;
    body: any;
  }) {
    const isValid = this.verifyWebhookSignature(params.rawBody, params.signature);
    if (!isValid) {
      await prisma.paymentEvent.create({
        data: {
          eventId: params.eventIdHeader || null,
          eventType: "SIGNATURE_REJECTED",
          source: "WEBHOOK",
          payload: {
            event: params.body?.event || "unknown",
            reason: "Invalid x-razorpay-signature header",
          },
        },
      });
      throw new PaymentServiceError(
        "Invalid Razorpay webhook signature.",
        400,
        "INVALID_WEBHOOK_SIGNATURE"
      );
    }

    // Deduplicate webhook delivery by x-razorpay-event-id
    if (params.eventIdHeader) {
      const existingEvent = await prisma.paymentEvent.findFirst({
        where: { eventId: params.eventIdHeader, source: "WEBHOOK" },
      });
      if (existingEvent) {
        return { processed: true, duplicate: true, event: params.body?.event || "unknown" };
      }
    }

    const eventName: string = params.body?.event || "";
    const paymentEntity = params.body?.payload?.payment?.entity;
    const refundEntity = params.body?.payload?.refund?.entity;

    if (eventName === "payment.captured" && paymentEntity?.order_id) {
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: paymentEntity.order_id },
      });
      if (!payment) {
        return { processed: false, duplicate: false, event: eventName, note: "Order not found locally" };
      }
      await this.finalizeSuccessfulPayment({
        paymentId: payment.id,
        razorpayPaymentId: paymentEntity.id,
        paymentMethod: paymentEntity.method || "UPI",
        source: "WEBHOOK",
        webhookEventId: params.eventIdHeader,
      });
      return { processed: true, duplicate: false, event: eventName };
    }

    if (eventName === "payment.failed" && paymentEntity?.order_id) {
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: paymentEntity.order_id },
      });
      if (payment && payment.status !== "SUCCESS" && payment.status !== "REFUNDED") {
        await this.markPaymentFailed({
          razorpayOrderId: paymentEntity.order_id,
          failureCode: paymentEntity.error_code || "WEBHOOK_FAILED",
          failureReason: paymentEntity.error_description || "Payment failed at gateway.",
          source: "WEBHOOK",
          webhookEventId: params.eventIdHeader,
        });
      }
      return { processed: true, duplicate: false, event: eventName };
    }

    if (eventName === "refund.processed" && refundEntity?.payment_id) {
      const payment = await prisma.payment.findFirst({
        where: { razorpayPaymentId: refundEntity.payment_id },
      });
      if (payment) {
        const refundInr = Number(((refundEntity.amount || 0) / 100).toFixed(2)) || payment.amount;
        const isFull = Math.abs(refundInr - payment.amount) < 0.01;
        const nextStatus = isFull ? "REFUNDED" : "PARTIALLY_REFUNDED";

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: nextStatus,
            refundId: refundEntity.id || payment.refundId,
            refundAmount: refundInr,
            refundedAt: payment.refundedAt || new Date(),
          },
        });

        if (payment.bookingId) {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { paymentStatus: nextStatus },
          });
        }

        await prisma.paymentEvent.create({
          data: {
            paymentId: payment.id,
            eventId: params.eventIdHeader || null,
            eventType: "WEBHOOK_REFUND_PROCESSED",
            source: "WEBHOOK",
            payload: {
              refundId: refundEntity.id,
              refundAmount: refundInr,
            },
          },
        });
      }
      return { processed: true, duplicate: false, event: eventName };
    }

    // Record unhandled but validly signed webhook events for auditability
    await prisma.paymentEvent.create({
      data: {
        eventId: params.eventIdHeader || null,
        eventType: `WEBHOOK_${eventName.toUpperCase().replace(/\./g, "_") || "OTHER"}`,
        source: "WEBHOOK",
        payload: { event: eventName },
      },
    });

    return { processed: true, duplicate: false, event: eventName };
  },
};

