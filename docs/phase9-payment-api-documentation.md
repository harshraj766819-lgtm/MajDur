# MajDur (मजदूर) — Phase 9 Payment System API & Webhook Reference
**Razorpay Test Mode Integration**

> **Base URL:** `http://localhost:5000/api`  
> **Authentication:** JWT (`Authorization: Bearer <token>` or `majdur_access_token` HTTP-only cookie)  
> **Webhook Auth:** HMAC-SHA256 via `x-razorpay-signature` header over raw request bytes  
> **Currency:** INR (`₹`) — exact integer Paise (`amountPaise = Math.round(amount * 100)`)  

---

## 1. Public & Authenticated REST Endpoints

### 1.1 `GET /api/payments/config`
Returns public checkout runtime settings. **Never exposes `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`.**
- **Auth:** Required (any authenticated role)
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "keyId": "rzp_test_...",
    "mode": "SANDBOX",
    "isSandbox": true,
    "isTestMode": true,
    "currency": "INR",
    "currencySymbol": "₹",
    "testModeBanner": "Razorpay Test Mode Active — Simulated transactions only. No real money is charged."
  }
}
```

### 1.2 `POST /api/payments/create-order`
Creates a Razorpay Test Order for an eligible booking. **Server strictly derives the amount from `Booking.totalAmount` in MongoDB (client-supplied amounts are ignored).**
- **Auth:** Booking Customer or `ADMIN`
- **Rate Limit:** 120 req / 15 min per IP
- **Eligibility:** Booking status must be `ACCEPTED`, `CONFIRMED`, `IN_PROGRESS`, or `COMPLETED`, and not already `PAID`.
- **Request Body:** `{ "bookingId": "<ObjectId>" }`
- **Response (`201 Created`):** Returns persisted `payment` record (`status: "PENDING"`) + `checkout` payload (`keyId`, `orderId`, `amount` in paise, `amountInr`, `currency`, `receipt`, `prefill`, `theme`, `mode`, `isSandbox`).
- **Errors:** `400` (not payable / invalid amount), `403` (IDOR / not booking customer), `404` (booking not found), `409` (already paid).

### 1.3 `POST /api/payments/verify`
Cryptographically verifies Razorpay checkout callback using `HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)` via `crypto.timingSafeEqual`.
- **Auth:** Payment Owner or `ADMIN`
- **Request Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "<64-char-hex-hmac>",
  "paymentMethod": "UPI"
}
```
- **Side Effects on Success (`200 OK`):**
  1. `Payment.status` → `SUCCESS`, `verifiedAt` set.
  2. `Booking.paymentStatus` → `PAID`, `paidAmount` & `paidAt` set.
  3. If `Booking.status === "ACCEPTED"`, automatically transitions to `CONFIRMED` with a `BookingStatusHistory` audit entry.
  4. Syncs existing `Invoice` (`paidAt`, `paymentId`, `razorpayPaymentId`, `paymentMethod`) or auto-generates a new verified Tax Invoice (`INV-YYYY-XXXXXXX`).
  5. Dispatches persistent notifications (`PAYMENT_SUCCESS` to Customer, `PAYMENT_RECEIVED` to Worker) and emits Socket.IO `payment:updated`.
  6. Records `PAYMENT_VERIFIED` in `PaymentEvent`.
- **Idempotency:** Re-submitting the identical `razorpay_order_id` + `razorpay_payment_id` returns `200 OK` with `alreadyVerified: true`.
- **Security:** Tampered signature returns `400 Bad Request` and logs `SIGNATURE_REJECTED` in `PaymentEvent`.

### 1.4 `POST /api/payments/fail`
Records a failed or dismissed checkout attempt (`Payment.status: "FAILED"`, `Booking.paymentStatus: "FAILED"`), notifies the customer, and allows immediate retry via `/create-order`.
- **Auth:** Payment Owner or `ADMIN`
- **Request Body:** `{ "razorpay_order_id": "order_...", "failureCode": "...", "failureReason": "..." }`

### 1.5 `POST /api/payments/sandbox/authorize`
Local Razorpay Test Sandbox checkout helper (strictly disabled when real Razorpay Test/Live keys are active). Generates a server-signed `razorpay_payment_id` + HMAC-SHA256 `razorpay_signature` for interactive test checkout in Chrome.
- **Auth:** Payment Owner or `ADMIN`

### 1.6 `POST /api/payments/webhook`
Public Razorpay webhook listener secured strictly via raw-body HMAC-SHA256 signature verification (`x-razorpay-signature`) and event replay deduplication (`x-razorpay-event-id`).
- **Handled Events:**
  - `payment.captured`: Finalizes payment & confirms booking idempotently.
  - `payment.failed`: Marks payment & booking failed idempotently.
  - `refund.processed`: Marks payment & booking `REFUNDED` / `PARTIALLY_REFUNDED`.
- **Errors:** `400` on missing or invalid `x-razorpay-signature` (logged as `SIGNATURE_REJECTED`).

### 1.7 `GET /api/payments`
Role-scoped paginated payment history + aggregate KPI summary (`totalPaidAmount`, `pendingAmount`, `totalRefundedAmount`, `successfulCount`, `pendingCount`, `failedCount`, `refundedCount`).
- **Query Params:** `?status=ALL|SUCCESS|PENDING|FAILED|REFUNDED&page=1&limit=15`
- **Scoping:** `CUSTOMER` sees their payments, `WORKER` sees payments for their bookings, `ADMIN` sees all.

### 1.8 `GET /api/payments/booking/:bookingId`
Returns booking payment summary and all payment attempts/events. IDOR-protected (booking Customer, Worker, or Admin only).

### 1.9 `GET /api/payments/:id`
Returns single payment record with linked booking, invoice, and full `PaymentEvent` audit trail. IDOR-protected.

### 1.10 `POST /api/payments/:id/refund`
Initiates full or partial Razorpay Test Mode refund.
- **Auth & Policy:** `ADMIN` (any settled payment) OR owning `CUSTOMER` when booking is `CANCELLED` or `DISPUTED`.
- **Request Body:** `{ "amount": 1200, "reason": "Cancelled before work started" }` (`amount` optional — defaults to full payment amount).
- **Side Effects:** Updates `Payment` (`REFUNDED` or `PARTIALLY_REFUNDED`, `refundId`, `refundAmount`, `refundedAt`), updates `Booking.paymentStatus`, logs `REFUND_COMPLETED`, sends `PAYMENT_REFUNDED` notifications, emits Socket.IO `payment:updated`.

