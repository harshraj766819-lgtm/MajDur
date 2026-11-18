# MajDur (मजदूर) — Phase 9 Security Audit Report
## Razorpay Payment System (Test Mode)

> **Module:** Phase 9 — Payment System (Orders, Verification, Webhooks, Refunds, Receipts)  
> **Audit Date:** November 18, 2026  
> **Security Posture:** **HARDENED — ZERO CRITICAL/HIGH VULNERABILITIES**  

---

## 1. Threat Model & Mitigations Verified

| # | Threat Vector | Mitigation Implemented | Verification Evidence |
|---|---|---|---|
| 1 | **Accidental Live Charges** | Hard safety guard in `getGatewayRuntimeConfig()` rejects any `rzp_live_*` key unless `ALLOW_LIVE_PAYMENTS=true`. | `GET /api/payments/config` confirms `isTestMode: true`. |
| 2 | **Secret Key Leakage** | `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly server-only; never serialized in responses, logs, or frontend bundles. | Automated test asserts neither secret appears in config payload. |
| 3 | **Client Amount Tampering** | `POST /api/payments/create-order` ignores all client-supplied amount fields and derives exact integer paise (`Math.round(booking.totalAmount * 100)`) directly from MongoDB. | Automated test sent `{ amount: 1, totalAmount: 1 }` and verified server enforced ₹2400 (`240000` paise). |
| 4 | **Forged Checkout Signatures** | `POST /api/payments/verify` computes `HMAC-SHA256(order_id + "|" + payment_id, secret)` and verifies using `crypto.timingSafeEqual` (immune to timing attacks). | Forged signature rejected with `400` and recorded as `SIGNATURE_REJECTED` in `PaymentEvent`. |
| 5 | **Forged / Replayed Webhooks** | `POST /api/payments/webhook` validates `x-razorpay-signature` over raw Express request buffer (`req.rawBody`) using `crypto.timingSafeEqual`, and deduplicates `x-razorpay-event-id` via `PaymentEvent`. | Missing & tampered signatures rejected (`400`); valid capture settled; replay deduplicated (`duplicate: true`). |
| 6 | **Double-Charging / Replay** | Duplicate order creation on already `PAID` booking returns `409 Conflict`; re-verifying identical `paymentId` returns `200` idempotently; reusing `razorpayPaymentId` on a different order returns `409`. | Verified in Group 4 automated tests. |
| 7 | **IDOR & Privilege Escalation** | Strict participant scoping: only booking Customer (or Admin) can create/verify payments; only Customer/Worker/Admin can view booking payments; Strangers receive `403`. | Verified across order creation, details, booking payments, and refunds (`403`). |
| 8 | **Unauthorized Refunds & Double Refunds** | Customer can refund ONLY after booking is `CANCELLED` or `DISPUTED`; double refund on `REFUNDED` payment returns `400`. | Premature refund (`403`), stranger refund (`403`), double refund (`400`) all verified. |
| 9 | **Brute-Force / Abuse** | Dedicated `express-rate-limit` (`120 req / 15 min` per IP) applied to order creation, verification, failure, sandbox authorization, and refund routes. | Mounted on all sensitive mutation endpoints in `payments.routes.ts`. |
| 10 | **MongoDB Null Unique Index Crash** | Replaced `@unique` on nullable `Payment.razorpayPaymentId` with `@@index([razorpayPaymentId])` + service-level non-null uniqueness guard so multiple `PENDING` orders never collide on `null`. | Synchronized via `prisma db push` and verified with multiple concurrent orders. |

---

## 2. Cryptographic Standards Used
- **HMAC Algorithm:** SHA-256 (`crypto.createHmac("sha256", ...)`)
- **Comparison Primitive:** Constant-time `crypto.timingSafeEqual`
- **Webhook Payload Integrity:** Raw UTF-8 request bytes captured via Express `json({ verify })` hook prior to JSON parsing.
- **Audit Logging:** Every order creation, signature rejection, verification, webhook event, failure, and refund creates an immutable `PaymentEvent` record in MongoDB Atlas.

