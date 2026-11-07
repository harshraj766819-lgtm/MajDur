# MajDur (मजदूर) — Workforce & Skilled Services Marketplace

> **Tagline:** Find Work. Hire Workers. Build Your Future.  
> **Developer:** Harsh Singh  
> **Target Market:** India (INR ₹ • Asia/Kolkata • English & Hindi)  
> **Repository:** `d:\MajDur`  
> **Database:** MongoDB (Database: `majdur`)

---

## 1. Project Overview

**MajDur** is a modern Indian blue-collar and skilled trade marketplace connecting homeowners, commercial contractors, and enterprises with verified electricians, plumbers, masons, painters, carpenters, and daily wage labourers.

### Key Pillars
- **Direct Connect:** Connect workers and clients directly without middleman agency commissions.
- **Fair Wages:** Transparent market wage guidance across 45+ trades.
- **Aadhaar & KYC Verification:** Clear distinction between verified tradesmen and unverified listings.
- **Contractor Solutions:** Bulk workforce recruitment (10–100+ workers) for commercial construction sites.

---

## 2. Technology Stack

- **Frontend:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React Icons.
- **Backend:** Node.js, Express.js, TypeScript, REST API, Socket.IO (Real-time chat), Rate Limiting, Helmet security.
- **Database & ORM:** MongoDB, Prisma ORM (24 normalized collections).
- **Security:** bcryptjs (password hashing), jsonwebtoken (JWT authentication), Role-Based Access Control (RBAC).
- **Payment Gateway:** Razorpay (Test mode with server-side signature verification).

---

## 3. Project Architecture

```
MAJDUR/
├── frontend/             # Next.js 14 App Router client application
│   ├── src/
│   │   ├── app/          # Routes, layouts, pages
│   │   ├── components/   # UI components, layout, home sections
│   │   ├── lib/          # Utility helpers & styling functions
│   │   └── types/        # TypeScript interfaces
│   ├── tailwind.config.ts# Theme & color tokens (#101010, #D4AF37)
│   └── package.json
│
├── backend/              # Node.js + Express.js + Socket.IO REST server
│   ├── src/
│   │   ├── config/       # Environment & Prisma client setup
│   │   ├── middleware/   # Auth, error handling, rate limiting
│   │   ├── routes/       # Health, categories, workers, jobs, auth
│   │   ├── sockets/      # Socket.IO real-time chat gateway
│   │   ├── utils/        # Standard response formats & logging
│   │   └── server.ts     # Express server entry point
│   ├── prisma/           # Prisma MongoDB schema (24 collections) & seed script
│   └── package.json
│
├── docs/                 # Engineering architecture & API specifications
│   ├── ARCHITECTURE.md   # System design & topology
│   ├── API.md            # REST API endpoints & contracts
│   ├── DATABASE.md       # MongoDB collections, relations & indexes
│   ├── SECURITY.md       # RBAC, audit logging & privacy compliance
│   └── DEPLOYMENT.md     # Production deployment runbook
│
├── scripts/              # Diagnostic & database verification utilities
├── .env.example          # Environment variable template
└── README.md
```

---

## 4. Quick Start Guide (Windows)

### Prerequisites
- **Node.js:** v18+ (Tested on v24.16.0)
- **npm:** v9+ (Tested on v11.13.0)
- **MongoDB:** MongoDB Atlas or local MongoDB server (Database: `majdur`)
- **MongoDB CLI:** `mongosh` (Installed on `D:\mongosh.exe`)

### Step 1: Install Dependencies
```powershell
# From project root (d:\MajDur)
npm --prefix frontend install
npm --prefix backend install
npm install
```

### Step 2: Database Setup & Synchronization
Prisma with MongoDB uses `db push` for collection and index synchronization:
```powershell
# Verify MongoDB connection and collection counts
npm run db:test

# Synchronize Prisma schema with MongoDB collections and indexes
npm run prisma:push

# Seed default 32 trade categories and Super Admin account
npm run prisma:seed
```

### Step 3: Run the Development Servers
```powershell
# Option A: Run both Backend (port 5000) and Frontend (port 3000) concurrently
npm run dev

# Option B: Run separately in dedicated terminals
npm run dev:backend   # Express REST API & Sockets -> http://localhost:5000
npm run dev:frontend  # Next.js Web Application   -> http://localhost:3000
```

---

## 5. Development Roadmap & Phases

- [x] **Phase 1: Project Foundation & MongoDB Architecture** (Monorepo, Next.js, Express, Prisma + MongoDB, UI System, Homepage)
- [ ] **Phase 2: Design System & Theming** (Dark/Gold palette, light theme toggle, responsive layout)
- [ ] **Phase 3: Homepage Polish** (Categories, testimonials, search engine, FAQs)
- [ ] **Phase 4: Authentication System** (Customer, Worker, Contractor, Admin, JWT, OTP, RBAC)
- [ ] **Phase 5: Customer Management** (Profile, search, job posting, reviews)
- [ ] **Phase 6: Worker Management** (Profile, skills, availability, earnings)
- [ ] **Phase 7: Contractor Management** (Project creation, team recruitment, GST invoicing)
- [ ] **Phase 8: Marketplace Engine** (Search filters, booking lifecycle, Socket.IO chat)
- [ ] **Phase 9: Payment System** (Razorpay test integration, webhook verification)
- [ ] **Phase 10: Admin Dashboard** (KYC review, worker approvals, dispute resolution)
- [ ] **Phase 11: Quality & Testing** (Security audit, unit & E2E tests)
- [ ] **Phase 12: Deployment** (Production build, Vercel/Render hosting, final smoke tests)

---

## 6. Credits

**Developed by:** Harsh Singh  
**Platform:** MajDur (मजदूर)
