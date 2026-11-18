# MajDur REST API Specification

**Author / Developer:** Harsh Singh  
**Tagline:** Find Work. Hire Workers. Build Your Future.  
**Platform:** MajDur (मजदूर) India  
**Base URL:** `http://localhost:5000/api`  
**Database:** MongoDB Atlas (24 collections)  

---

## 1. System & Telemetry

### GET `/api/health`
Returns system telemetry, process uptime, and database reachability.
- **Access:** Public
- **Response `200`:**
```json
{
  "status": "healthy",
  "platform": "MajDur Full-Stack Platform",
  "developer": "Harsh Singh",
  "uptimeSeconds": 120,
  "services": {
    "backend": { "status": "up", "port": 5000 },
    "database": { "engine": "MongoDB", "status": "connected", "latencyMs": 802 }
  }
}
```

### GET `/api/categories`
Returns all 32 active trade categories with Hindi titles, icons, and base wage benchmarks.
- **Access:** Public

---

## 2. Authentication & Security (Phase 4)

- `POST /api/auth/register/customer` — Customer sign-up (phone, name, password)
- `POST /api/auth/register/worker` — Worker sign-up (trade, experience, city, daily rate)
- `POST /api/auth/register/contractor` — Contractor sign-up (company, GST, contact person)
- `POST /api/auth/login` — Dual-identifier (Phone/Email) sign-in with role validation
- `POST /api/auth/refresh` — Atomic rotating refresh tokens (7 days)
- `POST /api/auth/logout` & `POST /api/auth/logout-all` — Session revocation
- `GET /api/auth/me` — Protected user profile fetch
- `POST /api/auth/otp/send` & `POST /api/auth/otp/verify` — 6-digit SMS OTP with 60s cooldown
- `POST /api/auth/password/forgot` & `POST /api/auth/password/reset` — Single-use password reset tokens (30m)

---

## 3. Customer Portal (Phase 5)

- `GET /api/customer/dashboard` — Live metrics, booking counts, total spend, recent bookings & notifications
- `GET /api/customer/profile` & `PUT /api/customer/profile` — View & update personal profile details
- `PUT /api/customer/change-password` — Secure password update with current password verification
- `POST /api/customer/addresses` — Add site address with default flag handling
- `PUT /api/customer/addresses/:id` — Update site address details
- `DELETE /api/customer/addresses/:id` — Remove site address
- `GET /api/workers` & `GET /api/workers/search` — Filterable worker directory (32 trades, city, rating)
- `GET /api/workers/:id` — Detailed worker profile with genuine reviews
- `POST /api/bookings` — Create `REQUESTED` direct booking contract (`MD-YYYY-XXXXXX`)
- `GET /api/bookings` & `GET /api/bookings/:id` — Role-scoped list & IDOR-protected details
- `PATCH /api/bookings/:id/cancel` — Cancel eligible active bookings (`REQUESTED`, `ACCEPTED`)
- `POST /api/reviews` — Submit genuine review for completed booking (recalculates worker rating)
- `GET /api/invoices` & `GET /api/invoices/:id` — IDOR-protected invoice ledger
- `GET /api/invoices/:id/download` — Stream binary PDF invoice with `%PDF-` header via `pdfkit`
- `GET /api/notifications` — Notification list with unread counter
- `PATCH /api/notifications/:id/read` & `PATCH /api/notifications/read-all` — Read status management

---

## 4. Worker Portal (Phase 6)

- `GET /api/worker/dashboard` — Worker statistics (earnings, active work, proposals), recent work, matching jobs
- `GET /api/worker/profile` & `PUT /api/worker/profile` — Full artisan profile editor with bounds validation
- `GET /api/worker/onboarding` & `POST /api/worker/onboarding` — 4-step progressive onboarding wizard
- `GET /api/worker/skills` & `POST /api/worker/skills` — Skills matrix CRUD with canonical MongoDB trade skills
- `PUT /api/worker/skills/:id` & `DELETE /api/worker/skills/:id` — Manage skill experience years (IDOR protected)
- `GET /api/worker/rates` & `PUT /api/worker/rates` — Pricing matrix (Daily Rate ₹300-₹30,000, Hourly Rate ₹40-₹5,000)
- `GET /api/worker/service-areas` & `POST /api/worker/service-areas` — Geographic coverage CRUD with 6-digit PIN validation
- `DELETE /api/worker/service-areas/:id` — Remove service area (IDOR protected)
- `GET /api/worker/availability` & `PUT /api/worker/availability` — Toggle live hiring availability & view schedule
- `GET /api/worker/jobs` & `GET /api/worker/jobs/:id` — Marketplace open jobs feed with multi-dimensional filters
- `POST /api/worker/applications` — Submit job proposal with proposed rate and cover note (duplicate blocked: 409)
- `GET /api/worker/applications` & `GET /api/worker/applications/:id` — Proposals tracking with status filters
- `PATCH /api/worker/applications/:id/withdraw` — Withdraw pending proposal (IDOR protected)
- `GET /api/worker/work` — Work assignments queue (`REQUESTED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`)
- `PATCH /api/worker/work/:id/status` — Lifecycle state machine (`ACCEPTED`, `IN_PROGRESS`, `COMPLETED`)
- `GET /api/worker/earnings` — Confirmed earnings derived from completed work
- `GET /api/worker/earnings/statement` — Stream official binary PDF earnings statement (`pdfkit`)
- `GET /api/worker/verification` & `POST /api/worker/verification` — Government KYC identity document workflow
