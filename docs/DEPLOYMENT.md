# MajDur Production Deployment Playbook

**Author:** Harsh Singh  
**Application:** MajDur

---

## 1. Hosting Architecture
- **Frontend:** Vercel (Next.js 14 App Router, edge cache, automatic HTTPS).
- **Backend:** Render / Railway / AWS EC2 (Node.js runtime, Socket.IO sticky sessions).
- **Database:** Supabase / Neon / AWS RDS (PostgreSQL 16 managed instance).
- **Media Storage:** Cloudinary (secure asset uploads and image transformations).

## 2. Environment Variables Checklist
Ensure the following variables are configured in production:
```ini
NODE_ENV="production"
PORT=5000
DATABASE_URL="postgresql://user:pass@host:5432/majdur_db?sslmode=require"
FRONTEND_URL="https://majdur.in"
JWT_SECRET="<64_character_random_hex>"
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

## 3. Deployment Steps
1. Provision Managed PostgreSQL on Supabase or Neon.
2. Run database migrations: `npx prisma migrate deploy`.
3. Seed production categories: `node prisma/seed.js`.
4. Deploy backend to Render/Railway and attach domain `api.majdur.in`.
5. Deploy frontend to Vercel and attach domain `majdur.in`.
6. Configure Razorpay webhook pointing to `https://api.majdur.in/api/payments/webhook`.
