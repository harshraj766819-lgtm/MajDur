/**
 * MajDur — Phase 9 Payment System (Razorpay Test Mode) Comprehensive Test Suite
 * Tests: Config Guard, Server-Side Amount Integrity, Booking State Gating,
 *        Order Creation, Failure & Retry, HMAC-SHA256 Verification, Idempotency,
 *        Booking Auto-Confirmation, Invoice PDF Receipt, Worker Earnings Sync,
 *        Webhook Raw-Body HMAC Verification & Deduplication, Refund Lifecycle,
 *        and IDOR / RBAC Security.
 */

const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { PrismaClient } = require(path.resolve(__dirname, "../backend/node_modules/@prisma/client"));
const prisma = new PrismaClient();

const API_BASE = process.env.TEST_API_BASE || "http://localhost:5000/api";
const WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  "majdur-razorpay-test-webhook-secret-2026";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function apiReq(endpoint, { method = "GET", token = null, body = null, headers = {} } = {}) {
  const reqHeaders = { ...headers };
  if (body !== null && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body !== null ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, buffer: buf, headers: res.headers };
  }

  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

async function runTests() {
  const ts = Date.now();
  const suffix = String(ts).slice(-7);
  const createdUserIds = [];
  const createdBookingIds = [];
  const createdPaymentIds = [];

  console.log("\n==============================================================");
  console.log("  MAJDUR — PHASE 9 PAYMENT SYSTEM (RAZORPAY TEST MODE) SUITE");
  console.log("==============================================================\n");

  try {
    // ----------------------------------------------------------
    // SETUP: Register isolated Customer, Worker, and Stranger
    // ----------------------------------------------------------
    console.log("📋 Setting up isolated test accounts...");
    const custReg = await apiReq("/auth/register/customer", {
      method: "POST",
      body: {
        name: "Phase9 Customer",
        email: `p9.cust.${ts}@majdur.test`,
        phone: `911${suffix}`,
        password: "Password@123",
      },
    });
    assert(custReg.status === 201 && !!custReg.json?.data?.accessToken, "Registered isolated test Customer");
    const customerToken = custReg.json.data.accessToken;
    const customerId = custReg.json.data.user.id;
    createdUserIds.push(customerId);

    const workerReg = await apiReq("/auth/register/worker", {
      method: "POST",
      body: {
        name: "Phase9 Electrician",
        email: `p9.worker.${ts}@majdur.test`,
        phone: `922${suffix}`,
        password: "Password@123",
        trade: "Electrician",
        experienceYears: 6,
        city: "Lucknow",
        pincode: "226001",
        dailyRate: 1200,
      },
    });
    assert(workerReg.status === 201 && !!workerReg.json?.data?.accessToken, "Registered isolated test Worker");
    const workerToken = workerReg.json.data.accessToken;
    const workerId = workerReg.json.data.user.id;
    createdUserIds.push(workerId);

    const strangerReg = await apiReq("/auth/register/customer", {
      method: "POST",
      body: {
        name: "Phase9 Stranger",
        email: `p9.stranger.${ts}@majdur.test`,
        phone: `933${suffix}`,
        password: "Password@123",
      },
    });
    assert(strangerReg.status === 201 && !!strangerReg.json?.data?.accessToken, "Registered isolated Stranger user");
    const strangerToken = strangerReg.json.data.accessToken;
    const strangerId = strangerReg.json.data.user.id;
    createdUserIds.push(strangerId);

    // ----------------------------------------------------------
    // GROUP 1: Config & Security Guardrails
    // ----------------------------------------------------------
    console.log("\n📋 Group 1: Config & Test Mode Security Guardrails");
    const unauthCfg = await apiReq("/payments/config");
    assert(unauthCfg.status === 401, "Unauthenticated GET /api/payments/config rejected with 401");

    const cfgRes = await apiReq("/payments/config", { token: customerToken });
    assert(cfgRes.status === 200, "Authenticated GET /api/payments/config returns 200");
    assert(cfgRes.json.data?.isTestMode === true, "Gateway explicitly enforces Test Mode (isTestMode: true)");
    assert(cfgRes.json.data?.currency === "INR", "Currency is INR");
    assert(
      !cfgRes.json.data?.keySecret && !cfgRes.json.data?.webhookSecret && !JSON.stringify(cfgRes.json).includes("keySecret"),
      "Config response never leaks keySecret or webhookSecret"
    );

    // ----------------------------------------------------------
    // GROUP 2: Booking State Gating & Server-Side Amount Integrity
    // ----------------------------------------------------------
    console.log("\n📋 Group 2: Booking State Gating & Server-Side Amount Integrity");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const b1Res = await apiReq("/bookings", {
      method: "POST",
      token: customerToken,
      body: {
        workerId,
        serviceCategory: "Electrician",
        startDate: tomorrow,
        totalDays: 2,
        address: "Plot 42, Gomti Nagar",
        city: "Lucknow",
        notes: "Full house wiring inspection",
      },
    });
    assert(b1Res.status === 201 && !!b1Res.json?.data?.id, "Created Booking #1 (2 days @ ₹1200 = ₹2400)");
    const booking1Id = b1Res.json.data.id;
    createdBookingIds.push(booking1Id);

    const earlyOrder = await apiReq("/payments/create-order", {
      method: "POST",
      token: customerToken,
      body: { bookingId: booking1Id },
    });
    assert(earlyOrder.status === 400, "Payment order rejected while booking is still REQUESTED (400)");

    // Worker accepts booking
    const accept1 = await apiReq(`/bookings/${booking1Id}/accept`, {
      method: "PATCH",
      token: workerToken,
      body: { note: "Ready to take on the electrical work" },
    });
    assert(accept1.status === 200 && accept1.json?.data?.status === "ACCEPTED", "Worker accepted Booking #1");

    // RBAC / IDOR checks on order creation
    const workerOrderAttempt = await apiReq("/payments/create-order", {
      method: "POST",
      token: workerToken,
      body: { bookingId: booking1Id },
    });
    assert(workerOrderAttempt.status === 403, "Worker cannot create payment order for Customer booking (403)");

    const strangerOrderAttempt = await apiReq("/payments/create-order", {
      method: "POST",
      token: strangerToken,
      body: { bookingId: booking1Id },
    });
    assert(strangerOrderAttempt.status === 403, "Stranger cannot create payment order for Customer booking (403)");

    // Customer creates order WITH tampered client amount (server must ignore tampered amount)
    const order1Res = await apiReq("/payments/create-order", {
      method: "POST",
      token: customerToken,
      body: { bookingId: booking1Id, amount: 1, totalAmount: 1 },
    });
    assert(order1Res.status === 201, "Customer created Razorpay Test Order #1 (201)");
    const order1 = order1Res.json.data;
    createdPaymentIds.push(order1.payment.id);
    assert(order1.payment.amount === 2400, "Server ignored client tampering and enforced ₹2400 amount");
    assert(order1.payment.amountPaise === 240000, "Exact integer paise computed (240000 paise)");
    assert(order1.checkout.amount === 240000 && order1.checkout.orderId === order1.payment.razorpayOrderId, "Checkout payload matches persisted Razorpay order");
    assert(order1.payment.status === "PENDING", "Initial payment status is PENDING");

    // ----------------------------------------------------------
    // GROUP 3: Payment Failure & Retry Flow
    // ----------------------------------------------------------
    console.log("\n📋 Group 3: Payment Failure & Retry Flow");
    const failRes = await apiReq("/payments/fail", {
      method: "POST",
      token: customerToken,
      body: {
        razorpay_order_id: order1.payment.razorpayOrderId,
        failureCode: "TEST_INSUFFICIENT_FUNDS",
        failureReason: "Simulated test bank decline",
      },
    });
    assert(failRes.status === 200 && failRes.json.data?.status === "FAILED", "Payment failure recorded cleanly (FAILED)");

    const retryOrderRes = await apiReq("/payments/create-order", {
      method: "POST",
      token: customerToken,
      body: { bookingId: booking1Id },
    });
    assert(retryOrderRes.status === 201, "Customer successfully created retry Order #1B after failure");
    const order1B = retryOrderRes.json.data;
    createdPaymentIds.push(order1B.payment.id);
    assert(
      order1B.payment.razorpayOrderId !== order1.payment.razorpayOrderId,
      "Retry order received a distinct razorpayOrderId"
    );

    // ----------------------------------------------------------
    // GROUP 4: Cryptographic HMAC-SHA256 Verification & Lifecycle Sync
    // ----------------------------------------------------------
    console.log("\n📋 Group 4: Cryptographic HMAC-SHA256 Verification, Idempotency & Auto-Confirmation");
    const forgedVerify = await apiReq("/payments/verify", {
      method: "POST",
      token: customerToken,
      body: {
        razorpay_order_id: order1B.payment.razorpayOrderId,
        razorpay_payment_id: "pay_TestForged12345",
        razorpay_signature: "0000000000000000000000000000000000000000000000000000000000000000",
        paymentMethod: "UPI",
      },
    });
    assert(forgedVerify.status === 400, "Forged HMAC signature rejected with 400 Bad Request");

    // Verify SIGNATURE_REJECTED audit event logged
    const rejectedEvents = await prisma.paymentEvent.findMany({
      where: { paymentId: order1B.payment.id, eventType: "SIGNATURE_REJECTED" },
    });
    assert(rejectedEvents.length >= 1, "Forged signature attempt recorded in PaymentEvent audit log");

    // Authorize sandbox payment and verify with real HMAC-SHA256
    const sandboxAuth = await apiReq("/payments/sandbox/authorize", {
      method: "POST",
      token: customerToken,
      body: {
        razorpay_order_id: order1B.payment.razorpayOrderId,
        paymentMethod: "UPI",
      },
    });
    assert(sandboxAuth.status === 200 && !!sandboxAuth.json.data?.razorpay_signature, "Sandbox test authorization produced valid HMAC signature");

    const verifyRes = await apiReq("/payments/verify", {
      method: "POST",
      token: customerToken,
      body: sandboxAuth.json.data,
    });
    assert(verifyRes.status === 200, "Valid HMAC-SHA256 payment verified with 200 OK");
    assert(verifyRes.json.data?.payment?.status === "SUCCESS", "Payment status transitioned to SUCCESS");
    assert(verifyRes.json.data?.booking?.status === "CONFIRMED", "Booking automatically transitioned ACCEPTED -> CONFIRMED");
    assert(verifyRes.json.data?.booking?.paymentStatus === "PAID", "Booking paymentStatus updated to PAID");
    assert(verifyRes.json.data?.booking?.paidAmount === 2400, "Booking paidAmount equals ₹2400");
    assert(!!verifyRes.json.data?.invoice?.invoiceNumber && !!verifyRes.json.data?.invoice?.paidAt, "Verified Tax Invoice auto-generated with paidAt timestamp");

    const invoiceId = verifyRes.json.data.invoice.id;

    // Idempotent re-verification
    const idempotentVerify = await apiReq("/payments/verify", {
      method: "POST",
      token: customerToken,
      body: sandboxAuth.json.data,
    });
    assert(
      idempotentVerify.status === 200 && idempotentVerify.json.data?.alreadyVerified === true,
      "Re-verifying same payment is strictly idempotent (alreadyVerified: true)"
    );

    // Prevent duplicate order on already PAID booking
    const dupOrderRes = await apiReq("/payments/create-order", {
      method: "POST",
      token: customerToken,
      body: { bookingId: booking1Id },
    });
    assert(dupOrderRes.status === 409, "Duplicate payment order on already PAID booking rejected with 409 Conflict");

    // Verify notifications dispatched to Customer & Worker
    const [custNotifs, workerNotifs] = await Promise.all([
      prisma.notification.findMany({ where: { userId: customerId, type: "PAYMENT_SUCCESS" } }),
      prisma.notification.findMany({ where: { userId: workerId, type: "PAYMENT_RECEIVED" } }),
    ]);
    assert(custNotifs.length >= 1, "Customer received PAYMENT_SUCCESS notification");
    assert(workerNotifs.length >= 1, "Worker received PAYMENT_RECEIVED notification");

    // ----------------------------------------------------------
    // GROUP 5: History, IDOR, PDF Receipt & Worker Earnings Integration
    // ----------------------------------------------------------
    console.log("\n📋 Group 5: History, IDOR, PDF Receipt & Worker Earnings Sync");
    const custHistory = await apiReq("/payments", { token: customerToken });
    assert(
      custHistory.status === 200 && custHistory.json.data?.summary?.totalPaidAmount === 2400,
      "Customer payment history returns accurate ₹2400 totalPaidAmount"
    );

    const workerHistory = await apiReq("/payments", { token: workerToken });
    assert(
      workerHistory.status === 200 && workerHistory.json.data?.payments?.some((p) => p.id === order1B.payment.id),
      "Worker payment history includes verified booking payment"
    );

    const strangerDetail = await apiReq(`/payments/${order1B.payment.id}`, { token: strangerToken });
    assert(strangerDetail.status === 403, "IDOR Guard: Stranger blocked from viewing payment detail (403)");

    const strangerBookingPayments = await apiReq(`/payments/booking/${booking1Id}`, { token: strangerToken });
    assert(strangerBookingPayments.status === 403, "IDOR Guard: Stranger blocked from booking payments (403)");

    const pdfRes = await apiReq(`/invoices/${invoiceId}/download`, { token: customerToken });
    assert(
      pdfRes.status === 200 && pdfRes.buffer && pdfRes.buffer.slice(0, 5).toString("utf8") === "%PDF-" && pdfRes.buffer.length > 1000,
      "Invoice/Receipt PDF downloads as valid binary PDF with Razorpay reference"
    );

    // Worker completes the confirmed paid booking
    const startWork = await apiReq(`/bookings/${booking1Id}/status`, {
      method: "PATCH",
      token: workerToken,
      body: { status: "IN_PROGRESS", note: "Arrived at site and started wiring" },
    });
    assert(startWork.status === 200, "Worker transitioned CONFIRMED -> IN_PROGRESS seamlessly");

    const completeWork = await apiReq(`/bookings/${booking1Id}/status`, {
      method: "PATCH",
      token: workerToken,
      body: { status: "COMPLETED", note: "Wiring completed and verified" },
    });
    assert(completeWork.status === 200, "Worker transitioned IN_PROGRESS -> COMPLETED seamlessly");

    const workerEarnings = await apiReq("/worker/earnings", { token: workerToken });
    assert(
      workerEarnings.status === 200 &&
        workerEarnings.json.data?.summary?.verifiedOnlinePaymentsTotal === 2400 &&
        workerEarnings.json.data?.transactions?.[0]?.razorpayPaymentId === sandboxAuth.json.data.razorpay_payment_id,
      "Worker earnings ledger reflects ₹2400 verified online Razorpay payout & paymentId"
    );

    // ----------------------------------------------------------
    // GROUP 6: Webhook HMAC Verification & Replay Deduplication
    // ----------------------------------------------------------
    console.log("\n📋 Group 6: Webhook Raw-Body HMAC Verification & Replay Deduplication");
    const b2Res = await apiReq("/bookings", {
      method: "POST",
      token: customerToken,
      body: {
        workerId,
        serviceCategory: "Electrician",
        startDate: tomorrow,
        totalDays: 1,
        address: "Sector 14, Indira Nagar",
        city: "Lucknow",
      },
    });
    const booking2Id = b2Res.json.data.id;
    createdBookingIds.push(booking2Id);

    await apiReq(`/bookings/${booking2Id}/accept`, { method: "PATCH", token: workerToken, body: {} });
    const order2Res = await apiReq("/payments/create-order", {
      method: "POST",
      token: customerToken,
      body: { bookingId: booking2Id },
    });
    const order2 = order2Res.json.data;
    createdPaymentIds.push(order2.payment.id);

    const webhookPayload = JSON.stringify({
      entity: "event",
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: `pay_TestWebhook${suffix}`,
            order_id: order2.payment.razorpayOrderId,
            amount: 120000,
            currency: "INR",
            method: "card",
            status: "captured",
          },
        },
      },
    });

    const missingSigWebhook = await apiReq("/payments/webhook", {
      method: "POST",
      body: webhookPayload,
    });
    assert(missingSigWebhook.status === 400, "Webhook without x-razorpay-signature rejected with 400");

    const badSigWebhook = await apiReq("/payments/webhook", {
      method: "POST",
      body: webhookPayload,
      headers: {
        "x-razorpay-signature": "invalid_signature_hash",
        "x-razorpay-event-id": `evt_bad_${ts}`,
      },
    });
    assert(badSigWebhook.status === 400, "Webhook with invalid HMAC signature rejected with 400");

    const validWebhookSig = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(Buffer.from(webhookPayload, "utf8"))
      .digest("hex");
    const eventId = `evt_capture_${ts}`;

    const validWebhook = await apiReq("/payments/webhook", {
      method: "POST",
      body: webhookPayload,
      headers: {
        "x-razorpay-signature": validWebhookSig,
        "x-razorpay-event-id": eventId,
      },
    });
    assert(
      validWebhook.status === 200 && validWebhook.json.data?.processed === true && validWebhook.json.data?.duplicate === false,
      "Valid HMAC payment.captured webhook accepted and settled Order #2"
    );

    const b2Check = await apiReq(`/bookings/${booking2Id}`, { token: customerToken });
    assert(
      b2Check.json.data?.status === "CONFIRMED" && b2Check.json.data?.paymentStatus === "PAID",
      "Webhook automatically confirmed Booking #2 and marked paymentStatus PAID"
    );

    const replayWebhook = await apiReq("/payments/webhook", {
      method: "POST",
      body: webhookPayload,
      headers: {
        "x-razorpay-signature": validWebhookSig,
        "x-razorpay-event-id": eventId,
      },
    });
    assert(
      replayWebhook.status === 200 && replayWebhook.json.data?.duplicate === true,
      "Webhook replay with identical x-razorpay-event-id deduplicated cleanly"
    );

    // ----------------------------------------------------------
    // GROUP 7: Cancellation & Refund Lifecycle
    // ----------------------------------------------------------
    console.log("\n📋 Group 7: Cancellation & Test Mode Refund Lifecycle");
    const prematureRefund = await apiReq(`/payments/${order2.payment.id}/refund`, {
      method: "POST",
      token: customerToken,
      body: { reason: "Premature refund attempt" },
    });
    assert(prematureRefund.status === 403, "Customer cannot refund active non-cancelled booking (403)");

    // Cancel paid Booking #2
    const cancel2 = await apiReq(`/bookings/${booking2Id}/cancel`, {
      method: "PATCH",
      token: customerToken,
      body: { reason: "Schedule changed by customer" },
    });
    assert(
      cancel2.status === 200 &&
        cancel2.json.data?.status === "CANCELLED" &&
        cancel2.json.data?.paymentStatus === "REFUND_PENDING",
      "Cancelling a PAID booking marks status CANCELLED and paymentStatus REFUND_PENDING"
    );

    const strangerRefund = await apiReq(`/payments/${order2.payment.id}/refund`, {
      method: "POST",
      token: strangerToken,
      body: { reason: "Unauthorized refund" },
    });
    assert(strangerRefund.status === 403, "IDOR Guard: Stranger blocked from refunding payment (403)");

    const refundRes = await apiReq(`/payments/${order2.payment.id}/refund`, {
      method: "POST",
      token: customerToken,
      body: { reason: "Cancelled before work started" },
    });
    assert(
      refundRes.status === 200 &&
        refundRes.json.data?.status === "REFUNDED" &&
        !!refundRes.json.data?.refundId &&
        refundRes.json.data?.refundAmount === 1200,
      "Full Razorpay Test Refund processed (status: REFUNDED, refundId generated, ₹1200)"
    );

    const doubleRefund = await apiReq(`/payments/${order2.payment.id}/refund`, {
      method: "POST",
      token: customerToken,
      body: { reason: "Duplicate refund attempt" },
    });
    assert(doubleRefund.status === 400, "Double refund on already REFUNDED payment rejected with 400");

    const b2AfterRefund = await apiReq(`/bookings/${booking2Id}`, { token: customerToken });
    assert(b2AfterRefund.json.data?.paymentStatus === "REFUNDED", "Booking #2 paymentStatus updated to REFUNDED");
  } finally {
    // Clean up all temporary test data
    console.log("\n🧹 Cleaning up isolated Phase 9 test records...");
    try {
      if (createdPaymentIds.length > 0) {
        await prisma.paymentEvent.deleteMany({ where: { paymentId: { in: createdPaymentIds } } });
        await prisma.payment.deleteMany({ where: { id: { in: createdPaymentIds } } });
      }
      await prisma.paymentEvent.deleteMany({
        where: { eventId: { startsWith: "evt_" } },
      });
      if (createdBookingIds.length > 0) {
        await prisma.invoice.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
        await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: createdBookingIds } } });
        await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.refreshSession.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.workerProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.customerProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
      console.log("  ✔ Cleanup completed cleanly.");
    } catch (cleanErr) {
      console.error("  ⚠ Cleanup warning:", cleanErr.message);
    }
    await prisma.$disconnect();
  }

  console.log("\n==============================================================");
  console.log(`  PHASE 9 PAYMENT SUITE RESULT: ${passed}/${passed + failed} PASSED (${failed} FAILED)`);
  console.log("==============================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Fatal test suite error:", err);
  process.exit(1);
});

