# MajDur REST API Specification

**Author:** Harsh Singh  
**Base URL:** `http://localhost:5000/api`

---

## 1. System & Health

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
    "database": { "engine": "PostgreSQL", "status": "connected", "latencyMs": 4 }
  }
}
```

### GET `/api/categories`
Returns all active service trades and standard daily rates.
- **Access:** Public

---

## 2. Planned Endpoints (Phases 4–10)

### Authentication
- `POST /api/auth/register` — Register Customer, Worker, or Contractor.
- `POST /api/auth/login` — Login with phone/email and password.
- `POST /api/auth/logout` — Invalidate user session.
- `POST /api/auth/forgot-password` — Generate reset token.
- `POST /api/auth/reset-password` — Set new password.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Workers
- `GET /api/workers` — Search & filter workers by trade, city, rate, rating.
- `GET /api/workers/:id` — Worker public profile.
- `POST /api/workers/profile` — Worker onboard and KYC details.
- `PATCH /api/workers/profile` — Update rates, skills, and availability.

### Jobs
- `GET /api/jobs` — Browse open requirements.
- `POST /api/jobs` — Post a job (Customer / Contractor).
- `GET /api/jobs/:id` — Job details.
- `POST /api/jobs/:id/apply` — Worker application submission.

### Bookings
- `GET /api/bookings` — User bookings list.
- `POST /api/bookings` — Create direct booking request.
- `GET /api/bookings/:id` — Booking lifecycle state.
- `PATCH /api/bookings/:id/status` — Accept, reject, start, complete.

### Payments
- `POST /api/payments/create-order` — Create Razorpay order ID.
- `POST /api/payments/verify` — Server-side signature validation.
- `POST /api/payments/webhook` — Razorpay event hook.

### Admin
- `GET /api/admin/dashboard` — Platform overview analytics.
- `GET /api/admin/users` — User management with search.
- `PATCH /api/admin/verifications/:id` — Approve or reject worker KYC documents.

