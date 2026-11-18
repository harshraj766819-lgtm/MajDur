# MajDur (मजदूर) — Phase 9 Master Implementation Plan
## Payment System (Razorpay Test Mode Integration)

> **Project:** MAJDUR (मजदूर) — *Find Work. Hire Workers. Build Your Future.*  
> **Developer:** Harsh Singh  
> **Workspace:** `D:\MajDur`  
> **Payment Gateway:** Razorpay (Test Mode Only — Live Credentials Strictly Blocked)  
> **Currency:** INR (`₹`, stored in Rupees + exact integer Paise)  
> **Date:** November 18, 2026  

---

## 1. Pre-Phase 9 Verification Gate (Phase 8 Stage 2 Audit)

Before initiating Phase 9, all Phase 8 Stage 2 deliverables were verified:
- **Notifications Engine:** Service, REST APIs, real-time Socket.IO delivery, Navbar Bell + Dropdown, Activity Center — **24/24 assertions passed**.
- **Real-Time Chat System:** 1-to-1 Conversations & Messages REST APIs, Socket.IO JWT handshake, room membership checks, delivery/read receipts, typing indicators, multi-tab presence — **55/55 assertions passed (26 REST + 29 Socket.IO)**.
- **Phase 8 Stage 1 Regression:** Search, filters, booking lifecycle, reviews, PDF invoices — **140/140 assertions passed**.
- **Browser & Responsive QA:** 25 Chrome screenshots verified across 5 viewports (`1920x1080`, `1366x768`, `768x1024`, `390x844`, `360x800`) under `test-evidence/phase8-stage2/`.
- **Error Handling & Security:** Zero critical/high defects in `docs/phase8-stage2-known-issues.md`.

---

## 2. Architectural Design & Booking Lifecycle Integration

### 2.1 Existing Booking State Machine Preservation
Existing Phase 8 Stage 1 transitions remain 100% intact so all prior booking flows and tests continue passing:
- `REQUESTED` → `ACCEPTED` | `REJECTED` | `CANCELLED`
- `ACCEPTED` → `CONFIRMED` | `IN_PROGRESS` | `CANCELLED` | `REJECTED`
- `CONFIRMED` → `IN_PROGRESS` | `CANCELLED`
- `IN_PROGRESS` → `COMPLETED` | `DISPUTED`
- `DISPUTED` → `IN_PROGRESS` | `COMPLETED` | `CANCELLED`

### 2.2 Payment State Machine & Booking Integration
A dedicated `paymentStatus` field on `Booking` tracks financial settlement independently:
- `UNPAID` → `PENDING` (Order created) → `PAID` (Signature/Webhook verified)
- `PENDING` → `FAILED` (Checkout failed/dismissed) → `PENDING` (Retry allowed)
- `PAID` → `REFUND_PENDING` (Paid booking cancelled) → `REFUNDED` | `PARTIALLY_REFUNDED`

**Lifecycle Triggers:**
1. **Eligibility:** Customer can initiate payment when `Booking.status` is `ACCEPTED`, `CONFIRMED`, `IN_PROGRESS`, or `COMPLETED` and `Booking.paymentStatus !== "PAID"`.
2. **Auto-Confirmation:** When a payment is verified for an `ACCEPTED` booking, `Booking.status` automatically advances to `CONFIRMED` with an entry in `BookingStatusHistory`.
3. **Auto-Receipt / Invoice Sync:** Payment verification marks an existing booking `Invoice` as `paidAt: now` (with `paymentId`, `razorpayPaymentId`, `paymentMethod`) or creates a verified `Invoice` automatically.
4. **Real-Time Notifications & Socket Sync:** Both Customer and Worker receive persistent notifications (`PAYMENT_SUCCESS`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`) plus real-time `payment:updated` Socket.IO events.
5. **Cancellation & Refund Flow:** Cancelling a `PAID` booking marks `Booking.paymentStatus = "REFUND_PENDING"`, unlocking instant Razorpay Test Refund processing.

---

## 3. Database Schema Enhancements (`backend/prisma/schema.prisma`)

1. **`PaymentStatus` enum:** `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`.
2. **`Booking` additions:** `paymentStatus` (default `"UNPAID"`), `paidAmount` (default `0`), `paidAt`.
3. **`Payment` enhancements:** `workerId`, `amountPaise`, `platformFee`, `taxAmount`, `receiptNumber`, `paymentMethod`, `paymentMode` (`"TEST"` | `"SANDBOX"`), `failureCode`, `failureReason`, `verifiedAt`, `refundReason`, `refundedAt`, `notes`, `events` relation. Note: nullable `razorpayPaymentId` uses a non-unique index to avoid MongoDB `E11000` duplicate-null errors while enforcing uniqueness for non-null IDs in service logic.
4. **`PaymentEvent` model (New):** Immutable audit trail & webhook deduplication store (`paymentId`, `eventId`, `eventType`, `source`, `payload`, `createdAt`).
5. **`Invoice` additions:** `paymentId`, `razorpayPaymentId`, `paymentMethod`.

---

## 4. Security & Razorpay Test Mode Architecture

1. **Test Mode Enforcement Guard:**
   - Strictly blocks `rzp_live_*` credentials unless `ALLOW_LIVE_PAYMENTS=true`.
   - Supports **Real Razorpay Test API** when valid `rzp_test_*` credentials are provided in `.env`, AND a **Razorpay Test Sandbox Adapter** when placeholder `rzp_test_*` keys are present in local development — using the **exact same HMAC-SHA256 signature verification (`crypto.timingSafeEqual`)** in both modes.
2. **Zero Client Amount Trust:** Amount in INR and paise is derived exclusively from `Booking.totalAmount` on the server.
3. **Cryptographic Verification:**
   - Checkout verification: `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)`.
   - Webhook verification: `HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)` against `x-razorpay-signature` header using raw Express request buffer.
4. **RBAC, IDOR & Rate Limiting:**
   - Strict booking participant checks (`customerId`, `workerId`, `ADMIN`).
   - Dedicated rate limiter on `/api/payments/create-order`, `/api/payments/verify`, and `/api/payments/:id/refund`.
   - Zero leakage of `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`.

---

## 5. Implementation Milestones

| Milestone | Scope | Key Files |
|---|---|---|
| **9.1** | Prisma Schema, Environment Guard & Razorpay SDK | `backend/prisma/schema.prisma`, `backend/src/config/environment.ts`, `backend/package.json` |
| **9.2** | Payment Service (Orders, HMAC Verify, Webhooks, Refunds, Receipts) | `backend/src/services/payment.service.ts` |
| **9.3** | Payment REST Routes, Raw Body Middleware, Booking/Invoice/Earnings Integration | `backend/src/routes/payments.routes.ts`, `backend/src/server.ts`, `backend/src/routes/bookings.routes.ts`, `backend/src/routes/invoices.routes.ts`, `backend/src/routes/worker.routes.ts` |
| **9.4** | Frontend API Client, Razorpay Checkout & Test Sandbox Modal | `frontend/src/lib/api.ts`, `frontend/src/components/payments/razorpay-checkout-button.tsx`, `frontend/src/components/payments/sandbox-checkout-modal.tsx` |
| **9.5** | Customer Payments Page, Booking Detail Pay/Refund UI, Sidebar & Worker Earnings Integration | `frontend/src/app/dashboard/customer/payments/page.tsx`, `frontend/src/app/dashboard/customer/bookings/[id]/page.tsx`, `frontend/src/app/dashboard/customer/bookings/page.tsx`, `frontend/src/app/dashboard/worker/bookings/page.tsx`, `frontend/src/app/dashboard/worker/earnings/page.tsx`, `frontend/src/components/layout/sidebar.tsx` |
| **9.6** | Automated Payment & Security Test Suite, Full Phase 1–8 Regression, Live Chrome QA & Final Documentation | `scripts/test-phase9-payments.js`, `test-evidence/phase9/`, `docs/phase9-*.md` |

