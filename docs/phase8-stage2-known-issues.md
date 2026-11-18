# MajDur (मजदूर) — Phase 8 Stage 2: Known Issues & Technical Limitations

> **Module:** Notifications Engine & Real-Time Chat System  
> **Status:** No Critical or High Defects. All Acceptance Criteria Met.  
> **Date:** November 15, 2026  

---

## 1. Defect Register

| Defect ID | Module | Description | Severity | Workaround / Current State | Planned Future Resolution |
|---|---|---|:---:|---|---|
| *None* | Core Notifications & Chat | All 219 test assertions passed. | *None* | Zero known defects in active code paths. | Continual monitoring in production. |

---

## 2. Technical Limitations & Architectural Observations

### 2.1 Single-Server Socket.IO State
- **Current Architecture:** Online presence (`userSocketsMap`) and socket rooms are currently held in-memory within the Node.js process.
- **Current Implication:** In single-instance deployment (current mode), this provides sub-millisecond responsiveness with zero external dependencies.
- **Future Infrastructure Requirement:** When horizontally scaling across multiple backend instances or container replicas, a **Redis Adapter** (`@socket.io/redis-adapter`) and a Redis-backed presence store (or Redis Streams) should be introduced so socket rooms and presence state synchronize seamlessly across all cluster nodes.

### 2.2 In-Memory Presence on Cold Server Restart
- **Observation:** If the backend server process is restarted, any currently open browser tabs will automatically reconnect via Socket.IO's built-in reconnection logic. Upon reconnecting, the server will immediately re-register their socket IDs and re-establish their online status.

### 2.3 Ephemeral Typing Events
- **Design Decision:** Typing events (`typing:start`, `typing:stop`) are purely ephemeral in-memory socket events and are intentionally **never written to MongoDB**. This prevents unnecessary database write load while maintaining instant visual feedback.

---

## 3. Strict Boundary Confirmation (Prohibited Features)

The following capabilities were explicitly prohibited by project governance and were **NOT** implemented in Phase 8 Stage 2:
1. **Phase 9 Payment Integration:** No Razorpay, no payment gateways, no wallet system, no refunds.
2. **File & Media Attachments:** No image sharing, audio recordings, or video clips in chat.
3. **Voice & Video Calling:** No WebRTC voice or video calls.
4. **Group Chat:** Chat is strictly 1-to-1 between verified conversation members.
5. **External Messaging:** No SMS broadcasts, WhatsApp integrations, or third-party email campaigns.
6. **AI Chatbot Overlays:** No automated bot replies or AI message generators.

