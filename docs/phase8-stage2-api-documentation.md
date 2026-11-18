# MajDur (मजदूर) — Phase 8 Stage 2: REST API Documentation
**Notifications & Messaging API Reference**

> **Base URL:** `http://localhost:5000/api`  
> **Auth Scheme:** Dual-mode Bearer Token (`Authorization: Bearer <jwt>`) or HTTP-only Cookie (`majdur_access_token`)  
> **Envelope Standard:** All responses return `{ success: boolean, message: string, data: any, meta?: any }`  

---

## 1. Notifications Endpoints

### 1.1 `GET /api/notifications/unread-count`
Retrieves the total count of unread notifications for the authenticated user.
- **Auth:** Required (Any authenticated role)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Unread notification count retrieved",
    "data": {
      "unreadCount": 3
    }
  }
  ```

### 1.2 `GET /api/notifications`
Retrieves paginated notifications for the authenticated user ordered newest first.
- **Auth:** Required (Any authenticated role)
- **Query Parameters:**
  - `page` (optional integer, default: `1`)
  - `limit` (optional integer, default: `20`, max: `100`)
  - `unread` (optional boolean, e.g. `true` to return only unread notifications)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Notifications retrieved successfully",
    "data": {
      "notifications": [
        {
          "id": "6af9a95872624c598b72b83c",
          "userId": "6af9a0b18eb62bd9c02e2694",
          "title": "New Booking Request",
          "message": "Customer Amit requested your services (Electrical) starting 16/11/2026. Ref: MD-2026-928371",
          "type": "BOOKING_REQUEST",
          "isRead": false,
          "readAt": null,
          "link": "/dashboard/worker/bookings",
          "bookingId": "6af9a0b18eb62bd9c02e2691",
          "conversationId": null,
          "relatedUserId": "6af9a0b18eb62bd9c02e2690",
          "createdAt": "2026-11-15T18:00:00.000Z",
          "updatedAt": "2026-11-15T18:00:00.000Z"
        }
      ],
      "unreadCount": 1,
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "pageSize": 20,
        "totalResults": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    }
  }
  ```

### 1.3 `PATCH /api/notifications/:id/read`
Marks an individual notification as read. Enforces owner IDOR verification.
- **Auth:** Required (Must be the recipient)
- **URL Params:** `id` (MongoDB ObjectId)
- **Response `200 OK`:** Returns updated notification with `isRead: true` and `readAt: ISOString`.
- **Response `403/404`:** If notification does not exist or belongs to another user.

### 1.4 `PATCH /api/notifications/read-all`
Marks all unread notifications of the current user as read in a single batch operation.
- **Auth:** Required
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "All notifications marked as read",
    "data": {
      "updatedCount": 4
    }
  }
  ```

### 1.5 `DELETE /api/notifications/:id`
Deletes a notification from the user's inbox. Enforces owner IDOR verification.
- **Auth:** Required (Must be the recipient)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Notification deleted successfully",
    "data": null
  }
  ```

---

## 2. Conversations Endpoints

### 2.1 `POST /api/conversations`
Creates or retrieves an existing 1-to-1 conversation. Supports booking-linked and direct chats.
- **Auth:** Required
- **Request Body (Booking Linked):**
  ```json
  {
    "bookingId": "6af9a0b18eb62bd9c02e2691",
    "title": "Booking MD-2026-928371 (Optional)"
  }
  ```
- **Request Body (Direct Contact):**
  ```json
  {
    "targetUserId": "6af9a0b18eb62bd9c02e2692"
  }
  ```
- **Access Rule:** For booking-linked conversations, caller must be `booking.customerId`, `booking.workerId`, or `ADMIN`.
- **Response `200/201`:** Returns conversation record with `members` array and `booking` metadata.

### 2.2 `GET /api/conversations`
Lists all conversations belonging to the authenticated user with computed unread count.
- **Auth:** Required
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Conversations retrieved successfully",
    "data": [
      {
        "id": "6af9a0b18eb62bd9c02e2695",
        "title": "Booking MD-2026-928371",
        "bookingId": "6af9a0b18eb62bd9c02e2691",
        "lastMessage": "We need you on site by 9 AM.",
        "lastMessageAt": "2026-11-15T18:10:00.000Z",
        "unreadCount": 0,
        "members": [ ... ],
        "otherMember": {
          "id": "6af9a0b18eb62bd9c02e2692",
          "name": "Ramesh Sharma",
          "phone": "9876543210",
          "role": "WORKER"
        },
        "booking": {
          "id": "6af9a0b18eb62bd9c02e2691",
          "bookingNumber": "MD-2026-928371",
          "serviceCategory": "Electrical",
          "status": "ACCEPTED"
        }
      }
    ]
  }
  ```

### 2.3 `GET /api/conversations/:id`
Retrieves detailed metadata for a single conversation.
- **Auth:** Required (Must be a conversation participant or Admin)
- **Response `200 OK`:** Detailed conversation object with member profiles.
- **Response `403 Forbidden`:** If caller is not an authorized participant.

### 2.4 `GET /api/conversations/:id/messages`
Retrieves paginated messages for a conversation ordered chronologically for rendering.
- **Auth:** Required (Participant only)
- **Query Parameters:**
  - `page` (optional integer, default: `1`)
  - `limit` (optional integer, default: `30`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "Messages retrieved successfully",
    "data": {
      "messages": [
        {
          "id": "6af9a0b18eb62bd9c02e2699",
          "conversationId": "6af9a0b18eb62bd9c02e2695",
          "senderId": "6af9a0b18eb62bd9c02e2690",
          "content": "Please bring a 15A switchboard.",
          "messageType": "TEXT",
          "status": "READ",
          "isRead": true,
          "createdAt": "2026-11-15T18:05:00.000Z",
          "sender": {
            "id": "6af9a0b18eb62bd9c02e2690",
            "name": "Amit Kumar",
            "role": "CUSTOMER"
          }
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "pageSize": 30,
        "totalResults": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    }
  }
  ```

### 2.5 `POST /api/conversations/:id/messages`
Sends a message using the REST fallback API.
- **Auth:** Required (Participant only)
- **Request Body:**
  ```json
  {
    "content": "I will arrive at the site by 9:30 AM.",
    "clientMessageId": "optional-unique-uuid-for-idempotency"
  }
  ```
- **Validation Rules:**
  - `content` must be non-empty and <= 4000 characters.
  - If `clientMessageId` already exists in this conversation, returns the existing record without duplicate persistence.
  - Dispatches in-app notification to the other participant.
- **Response `201 Created` / `200 OK (Idempotent)`**

### 2.6 `PATCH /api/conversations/:id/read`
Marks all messages sent by other participants as read and updates caller's `lastReadAt`.
- **Auth:** Required (Participant only)
- **Response `200 OK`:** `{ "success": true, "data": { "markedCount": 3 } }`

