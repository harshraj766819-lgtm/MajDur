# MajDur (मजदूर) — Phase 8 Stage 2: Socket.IO Event Specification
**Real-Time Real-Time Messaging & Presence Protocol**

> **Protocol Version:** 1.0.0  
> **Server Endpoint:** `http://localhost:5000` (or `process.env.NEXT_PUBLIC_SOCKET_URL`)  
> **Transports:** `["websocket", "polling"]`  

---

## 1. Handshake & Authentication

Every client establishing a Socket.IO connection must provide a valid JWT access token during the initial connection handshake.

### Client Connection Options
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
});
```

### Handshake Verification Pipeline
1. Extract token from `socket.handshake.auth.token`, `headers.authorization`, or cookie `majdur_access_token`.
2. Decode & verify cryptographic signature using `JWT_ACCESS_SECRET`.
3. Query MongoDB to ensure the user exists and `isActive: true`.
4. Attach user context to `socket.data.user = { id, name, role, phone }`.
5. Join user to personal room: `user:<userId>`.

---

## 2. Room Naming & Access Control

| Room Pattern | Target Audience | Access Requirements | Purpose |
|---|---|---|---|
| `user:<userId>` | The individual user across all their devices/tabs | Auto-joined on handshake | Pushing in-app notifications (`notification:new`) & presence updates |
| `conversation:<conversationId>` | Verified members of the conversation | Explicit `conversation:join` with DB membership check | Exchanging messages, typing status, and read receipts |

---

## 3. Client-to-Server Events

### 3.1 `conversation:join`
Joins the designated conversation room after verifying user membership.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695"
  }
  ```
- **Acknowledgement Callback:**
  ```json
  {
    "success": true,
    "conversationId": "6af9a0b18eb62bd9c02e2695"
  }
  ```
- **Failure:** Emits `error` with code `UNAUTHORIZED_ROOM` if caller is not an authorized participant.

### 3.2 `conversation:leave`
Leaves the conversation room.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695"
  }
  ```

### 3.3 `message:send`
Sends a message to a conversation. Persisted to MongoDB prior to broadcast.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695",
    "content": "Can you bring extra 2.5mm copper wire?",
    "clientMessageId": "msg-1731678900-uuid",
    "messageType": "TEXT"
  }
  ```
- **Acknowledgement Callback:**
  ```json
  {
    "success": true,
    "message": {
      "id": "6af9a0b18eb62bd9c02e2699",
      "conversationId": "6af9a0b18eb62bd9c02e2695",
      "senderId": "6af9a0b18eb62bd9c02e2690",
      "content": "Can you bring extra 2.5mm copper wire?",
      "status": "SENT",
      "createdAt": "2026-11-15T18:15:00.000Z"
    },
    "isDuplicate": false
  }
  ```

### 3.4 `message:read`
Notifies that the user has read all incoming messages in the conversation.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695"
  }
  ```

### 3.5 `typing:start` & `typing:stop`
Broadcasts typing activity to other room participants.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695"
  }
  ```

---

## 4. Server-to-Client Events

### 4.1 `message:new`
Broadcast to room `conversation:<conversationId>` (excluding sender).
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695",
    "message": {
      "id": "6af9a0b18eb62bd9c02e2699",
      "conversationId": "6af9a0b18eb62bd9c02e2695",
      "senderId": "6af9a0b18eb62bd9c02e2690",
      "content": "Can you bring extra 2.5mm copper wire?",
      "messageType": "TEXT",
      "status": "SENT",
      "isRead": false,
      "createdAt": "2026-11-15T18:15:00.000Z",
      "sender": {
        "id": "6af9a0b18eb62bd9c02e2690",
        "name": "Amit Kumar",
        "role": "CUSTOMER"
      }
    }
  }
  ```

### 4.2 `message:delivered`
Emitted back to the sender when the recipient is actively connected in the conversation room.
- **Payload:**
  ```json
  {
    "messageId": "6af9a0b18eb62bd9c02e2699",
    "conversationId": "6af9a0b18eb62bd9c02e2695",
    "deliveredAt": "2026-11-15T18:15:01.000Z"
  }
  ```

### 4.3 `message:read`
Broadcast to room when a participant reads incoming messages.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695",
    "readerId": "6af9a0b18eb62bd9c02e2692",
    "readAt": "2026-11-15T18:15:05.000Z"
  }
  ```

### 4.4 `typing:start` & `typing:stop`
Broadcast to room participants when another user starts or stops typing.
- **Payload:**
  ```json
  {
    "conversationId": "6af9a0b18eb62bd9c02e2695",
    "userId": "6af9a0b18eb62bd9c02e2692",
    "userName": "Ramesh Sharma"
  }
  ```

### 4.5 `presence:update`
Broadcast globally or to user contacts when an artisan or customer connects/disconnects.
- **Payload:**
  ```json
  {
    "userId": "6af9a0b18eb62bd9c02e2692",
    "status": "online",
    "timestamp": "2026-11-15T18:15:00.000Z"
  }
  ```

### 4.6 `notification:new`
Pushed directly to user's private room `user:<userId>`.
- **Payload:** Complete `Notification` object.

### 4.7 `error`
Emitted when an invalid or unauthorized action is attempted.
- **Payload:**
  ```json
  {
    "code": "UNAUTHORIZED_ROOM",
    "message": "You are not an authorized participant of this conversation"
  }
  ```

