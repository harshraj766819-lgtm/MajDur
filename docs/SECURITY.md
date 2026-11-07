# MajDur Security, Privacy & Compliance Policy

**Author:** Harsh Singh  
**Application:** MajDur Platform

---

## 1. Authentication & Session Security
- **Passwords:** Salted and hashed using `bcryptjs` with 10 rounds. Plaintext passwords are never stored or logged.
- **Tokens:** Short-lived JSON Web Tokens (JWT) signed using a cryptographically random secret key (`JWT_SECRET`).
- **Role-Based Access Control (RBAC):** Roles (`CUSTOMER`, `WORKER`, `CONTRACTOR`, `ADMIN`) are strictly enforced server-side. Client-supplied role headers are never trusted.

## 2. Privacy & Document Protection
- **KYC Documents:** Aadhaar, Voter IDs, and PAN cards are stored in private storage buckets and never exposed via public URLs.
- **Phone Numbers:** Masked where appropriate until mutual booking confirmation.
- **DPDP Act (India):** User consent is collected upon registration. Users can request data deletion or account suspension.

## 3. Defense in Depth
- **Input Sanitization:** Strict request validation using schemas (Zod).
- **HTTP Security Headers:** Implemented via `helmet`.
- **CORS:** Restricted to verified frontend domains.
- **Rate Limiting:** Protects `/api/auth/*` and public endpoints against brute force attacks.
- **Audit Logs:** All sensitive administrative operations are recorded in `AdminAuditLog`.

