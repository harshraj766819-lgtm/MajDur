# MajDur Architecture & System Topology

**Author:** Harsh Singh  
**Platform:** MajDur (India's Premier Workforce Marketplace)

---

## 1. Architectural Blueprint

```mermaid
flowchart TD
    subgraph Clients ["Client Layer"]
        Desktop["Desktop Browser (Next.js 14)"]
        Mobile["Mobile / Tablet Browser (Responsive Web)"]
    end

    subgraph FrontendApp ["Frontend Application (Port 3000)"]
        Pages["App Router Pages (/workers, /jobs, /dashboard)"]
        Components["Reusable UI Components (Button, Input, Card, Modal)"]
        ClientServices["API Service Clients & Socket Hooks"]
    end

    subgraph BackendAPI ["Backend API & Gateway (Port 5000)"]
        Express["Express.js HTTP Server"]
        SocketServer["Socket.IO Real-Time Engine"]
        Middlewares["Auth (JWT), Rate Limiter, Helmet, Error Handler"]
        Controllers["Workers, Jobs, Bookings, Payments, Admin"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        Prisma["Prisma ORM Client"]
        Postgres[("PostgreSQL 16 Database")]
        Cloudinary["Cloudinary (Media & Verification Docs)"]
    end

    subgraph External ["External Services"]
        Razorpay["Razorpay Payment Gateway"]
        SMS["SMS / OTP Provider (Twilio/Fast2SMS)"]
        Email["SMTP Email Provider"]
    end

    Clients --> FrontendApp
    FrontendApp -->|REST API Requests| Express
    FrontendApp -->|WebSocket Events| SocketServer
    Express --> Middlewares
    Middlewares --> Controllers
    Controllers --> Prisma
    Prisma --> Postgres
    Controllers --> Razorpay
    Controllers --> SMS
    Controllers --> Email
    Controllers --> Cloudinary
```

---

## 2. Directory Layout & Boundaries

- **`frontend/`**: Handles all user-facing presentation, client state, server-side rendering, responsive layouts, accessibility, and theme tokens (`#101010` dark theme, `#D4AF37` accent).
- **`backend/`**: Encapsulates database access, business rules, token issuance, password hashing, payment webhook validation, real-time message broadcasting, and administrative authorization.
- **`backend/prisma/`**: Single source of truth for the database schema containing 24 relational models.
- **`docs/`**: Technical contracts, data dictionaries, security policies, and deployment blueprints.

